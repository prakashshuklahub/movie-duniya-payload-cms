import type { CollectionConfig } from 'payload'

export const Movie: CollectionConfig = {
  slug: 'movies',
  access: {
    read: ({ req }) => Boolean(req.user),
    create: ({ req }) => false,
    update: ({ req }) => false,
    delete: ({ req }) => false,
  },
  fields: [
    { name: 'title', type: 'text', required: true },
    { name: 'description', type: 'textarea' },
    { name: 'releaseDate', type: 'date' },
  ],
}
