import type { CollectionConfig } from 'payload'

export const MovieApprovals: CollectionConfig = {
  slug: 'movie-approvals',
  access: {
    read: ({ req }) => Boolean(req.user),
    create: ({ req }) => req.user?.role === 'admin' || req.user?.role === 'editor',
    update: ({ req }) => req.user?.role === 'admin',
    delete: ({ req }) => req.user?.role === 'admin',
  },
  fields: [
    {
      name: 'movieData',
      type: 'group',
      fields: [
        { name: 'title', type: 'text' },
        { name: 'description', type: 'textarea' },
        { name: 'releaseDate', type: 'date' },
      ],
    },
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
    },
    {
      name: 'comment',
      type: 'textarea',
    },
    {
      name: 'submittedBy',
      type: 'relationship',
      relationTo: 'users',
    },
  ],
}
