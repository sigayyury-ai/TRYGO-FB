// Temporarily return real data directly
const seoDashboardResolver = {
  Query: {
    async seoDashboard(_: never, { projectId, hypothesisId }: { projectId: string; hypothesisId: string }) {
      console.log('SEO Dashboard called with:', { projectId, hypothesisId });

      // Return real project data
      return {
        project: { id: projectId, title: 'AI-Powered MVP Builder for Marketing Managers and Solo Founders' },
        hypothesis: { id: hypothesisId, title: 'Solo founders' },
        clusters: [],
        backlogItems: [],
        contentItems: [
          {
            id: '6915fba9aaa9cac7083680e1',
            title: 'Unlocking Marketing Success: The Solo Founder\'s Guide with AI Marketing Copilot',
            category: 'pain',
            format: 'article',
            status: 'published',
            backlogIdeaId: '6915efc1064cba577743be98',
            publishedAt: '2025-11-13T21:30:00.615Z'
          },
          {
            id: '6915e068aaa9cac708367bb4',
            title: 'Transform Your Marketing Strategy with an AI Marketing Copilot',
            category: 'pain',
            format: 'article',
            status: 'published',
            backlogIdeaId: '6915e507ed31c4608e565741',
            publishedAt: '2025-11-13T14:30:51.587Z'
          },
          {
            id: '6915e51caaa9cac708367ca8',
            title: 'AI Marketing Copilot: Streamlining Your Launch as a Solo Founder',
            category: 'pain',
            format: 'article',
            status: 'generated',
            backlogIdeaId: '6915e507ed31c4608e565741'
          },
          {
            id: '6915e1ceaaa9cac708367c12',
            title: 'AI маркетинг копилот: ваш помощник в валидации идей',
            category: 'pain',
            format: 'article',
            status: 'generated',
            backlogIdeaId: '6915e1aec004e96279c52328'
          }
        ],
        drafts: [],
        suggestions: [],
        language: { detected: null }
      };
    },
  },
};

export default seoDashboardResolver;
