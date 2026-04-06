import type { CollectionConfig, Where } from 'payload'

export const MovieApprovals: CollectionConfig = {
  slug: 'movie-approvals',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'status', 'submittedBy', 'createdAt'],
  },
  access: {
    read: ({ req }) => Boolean(req.user),
    create: ({ req }) => req.user?.role === 'admin' || req.user?.role === 'editor',
    update: ({ req }): boolean | Where => {
      const user = req.user
      if (!user) return false
      if (user.role === 'admin') {
        return { status: { not_in: ['approved', 'rejected'] } }
      }
      if (user.role === 'editor') {
        return {
          and: [{ status: { equals: 'changes_required' } }, { submittedBy: { equals: user.id } }],
        }
      }
      return false
    },
    delete: ({ req }) => req.user?.role === 'admin',
  },
  hooks: {
    beforeChange: [
      ({ data, req, operation, originalDoc }) => {
        if (operation === 'create') {
          return {
            ...data,
            submittedBy: req.user?.id,
            status: req.user?.role === 'editor' ? 'pending' : (data?.status ?? 'pending'),
          }
        }

        const editorResubmit =
          req.user?.role === 'editor' &&
          originalDoc?.status === 'changes_required' &&
          originalDoc?.submittedBy === req.user?.id

        return {
          ...data,
          ...(editorResubmit ? { status: 'pending' as const } : {}),
        }
      },
    ],
    afterChange: [
      async ({ doc, previousDoc, req, operation }) => {
        if (operation !== 'update') return
        if (previousDoc?.status === 'approved' || doc?.status !== 'approved' || doc?.movie) return

        const created = await req.payload.create({
          collection: 'movies',
          data: {
            title: doc.title,
            description: doc.movieData?.description,
            releaseDate: doc.movieData?.releaseDate,
          },
          req,
        })

        await req.payload.update({
          collection: 'movie-approvals',
          id: doc.id,
          data: { movie: created.id },
          req,
          context: { fromApprovalHook: true },
        })
      },
    ],
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Movie Details',
          fields: [
            { name: 'title', type: 'text', required: true },
            { name: 'description', type: 'textarea' },
            { name: 'releaseDate', type: 'date' },
          ],
        },
        {
          label: 'Approval',
          admin: {
            condition: (data, _s, { user }) =>
              user?.role === 'admin' ||
              (user?.role === 'editor' &&
                (data?.status === 'changes_required' ||
                  (data?.status === 'pending' && Boolean(data?.comment)))),
          },
          fields: [
            {
              name: 'status',
              type: 'select',
              options: [
                { label: 'Pending', value: 'pending' },
                { label: 'Approved', value: 'approved' },
                { label: 'Rejected', value: 'rejected' },
                { label: 'Changes Required', value: 'changes_required' },
              ],
              defaultValue: 'pending',
              admin: {
                condition: (_d, _s, { user }) => user?.role === 'admin',
              },
            },
            {
              name: 'comment',
              type: 'textarea',
              access: { update: ({ req }) => req.user?.role === 'admin' },
            },
          ],
        },
      ],
    },
    {
      name: 'submittedBy',
      type: 'relationship',
      relationTo: 'users',
      admin: {
        readOnly: true,
        position: 'sidebar',
        condition: (_d, _s, { user }) => user?.role === 'admin',
      },
    },
    {
      name: 'movie',
      type: 'relationship',
      relationTo: 'movies',
      admin: { hidden: true },
    },
  ],
}
