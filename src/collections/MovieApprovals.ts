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
      // Admins: edit until approved/rejected (not final)
      if (user.role === 'admin') {
        return {
          status: {
            not_in: ['approved', 'rejected'],
          },
        }
      }
      // Editors: only their own submission, and only while admin asked for changes
      if (user.role === 'editor') {
        return {
          and: [
            { status: { equals: 'changes_required' } },
            { submittedBy: { equals: user.id } },
          ],
        }
      }
      return false
    },
    delete: ({ req }) => req.user?.role === 'admin',
  },
  hooks: {
    beforeChange: [
      ({ data, req, operation, originalDoc }) => {
        // Mirror movie title to a top-level field for admin list/title usage
        const nextTitle = data?.movieData?.title

        if (operation !== 'create') {
          // Editor resubmitting after "changes required" → back to pending for admin review
          if (
            req.user?.role === 'editor' &&
            originalDoc?.status === 'changes_required' &&
            originalDoc?.submittedBy === req.user?.id
          ) {
            return {
              ...data,
              title: nextTitle ?? data?.title,
              status: 'pending',
            }
          }

          return {
            ...data,
            title: nextTitle ?? data?.title,
          }
        }

        return {
          ...data,
          title: nextTitle,
          submittedBy: req.user?.id,
          // Editors always submit as pending (and never choose status)
          status: req.user?.role === 'editor' ? 'pending' : (data?.status ?? 'pending'),
        }
      },
    ],
    afterChange: [
      async ({ doc, previousDoc, req, operation, context }) => {
        if (operation !== 'update') return
        if (context?.fromApprovalHook) return

        const wasApproved = previousDoc?.status === 'approved'
        const isApproved = doc?.status === 'approved'

        // Only create once when transitioning to approved
        if (!wasApproved && isApproved && !doc?.movie) {
          const created = await req.payload.create({
            collection: 'movies',
            data: doc.movieData,
            req,
          })

          await req.payload.update({
            collection: 'movie-approvals',
            id: doc.id,
            data: { movie: created.id },
            req,
            context: { fromApprovalHook: true },
          })
        }
      },
    ],
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      admin: {
        hidden: true,
      },
    },
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Movie Details',
          fields: [
            {
              name: 'movieData',
              type: 'group',
              fields: [
                { name: 'title', type: 'text', required: true },
                { name: 'description', type: 'textarea' },
                { name: 'releaseDate', type: 'date' },
              ],
            },
          ],
        },
        {
          label: 'Approval',
          admin: {
            condition: (data, _siblingData, { user }) =>
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
                condition: (_data, _siblingData, { user }) => user?.role === 'admin',
              },
            },
            {
              name: 'comment',
              type: 'textarea',
              access: {
                update: ({ req }) => req.user?.role === 'admin',
              },
              admin: {
                description:
                  'Admin feedback for the editor. Only admins can edit; editors can read.',
              },
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
        condition: (_data, _siblingData, { user }) => user?.role === 'admin',
      },
    },
    {
      name: 'movie',
      type: 'relationship',
      relationTo: 'movies',
      admin: {
        readOnly: true,
        position: 'sidebar',
        condition: (_data, _siblingData, { user }) => user?.role === 'admin',
      },
    },
  ],
}
