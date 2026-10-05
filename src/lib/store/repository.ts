import { getSupabaseServerClient, isSupabaseConfigured } from '@/lib/supabase/server';
import { Post, DispatchLog, Idea } from '@/types';

// In-memory fallback dataset for instant zero-config testing & offline resilience
const initialSeedIdeas: Idea[] = [
  {
    id: 'idea-1',
    raw_text: '💡 Why 90% of SaaS founders fail at social media: they treat Twitter/X like a press release wire instead of a two-way dinner table conversation. Break down the 3 mindset shifts that 10x engagement.',
    author: 'founder',
    tags: ['Strategy', 'SaaS', 'Twitter'],
    status: 'inbox',
    created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 4).toISOString(),
  },
  {
    id: 'idea-2',
    raw_text: '🔥 Behind the scenes: Shipping our unified multi-channel scheduler. 1-click publishing to Twitter, LinkedIn, Instagram & Threads combining Typefully + Buffer free tiers. Marketer workflow is now 5x faster.',
    author: 'founder',
    tags: ['Product', 'BehindTheScenes', 'Growth'],
    status: 'inbox',
    created_at: new Date(Date.now() - 3600000 * 18).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 18).toISOString(),
  },
  {
    id: 'idea-3',
    raw_text: '📊 Micro-case study: How consistent 9:00 AM weekday scheduling doubled our impressions on LinkedIn and X in 30 days without spending $1 on ads.',
    author: 'founder',
    tags: ['CaseStudy', 'Analytics'],
    status: 'inbox',
    created_at: new Date(Date.now() - 3600000 * 48).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 48).toISOString(),
  }
];

const initialSeedPosts: Post[] = [
  {
    id: 'post-1',
    title: 'The Content Flywheel Architecture',
    content: `Stop creating content for 4 different platforms from scratch. 🛑

Here is how our lean team scales our multi-channel distribution:

1. Founder drops raw voice notes & bullets into the Idea Inbox
2. Marketer polishes hooks and formats live previews
3. 1-click dispatches via Typefully (X + Threads) & Buffer (LinkedIn + Instagram)

Write once. Dominate everywhere. 🚀

#SaaS #Marketing #Productivity #Distribution`,
    channels: ['twitter', 'threads', 'linkedin', 'instagram'],
    status: 'scheduled',
    scheduled_at: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
    media_urls: ['https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&q=80'],
    author_role: 'marketer',
    author_name: 'Marketer Pro',
    notes: 'Approved by Founder. Ready for tomorrow 9 AM drop.',
    created_at: new Date(Date.now() - 7200000).toISOString(),
    updated_at: new Date(Date.now() - 7200000).toISOString(),
    dispatch_logs: [],
  },
  {
    id: 'post-2',
    title: 'Framework: High-Signal Social Writing',
    content: `Most corporate posts are boring because they edit out the human.

The 3-part framework for high-signal posts:
→ The Hook: Challenge a common myth
→ The Proof: 1 real metric or screenshot
→ The Takeaway: 1 action the reader can take in 5 minutes

Steal this template and try it today. What is your go-to framework?`,
    channels: ['twitter', 'linkedin'],
    status: 'published',
    published_at: new Date(Date.now() - 14400000).toISOString(),
    media_urls: [],
    author_role: 'founder',
    author_name: 'Alex Founder',
    notes: 'Published successfully earlier today.',
    created_at: new Date(Date.now() - 86400000).toISOString(),
    updated_at: new Date(Date.now() - 14400000).toISOString(),
    dispatch_logs: [
      {
        id: 'log-1',
        post_id: 'post-2',
        channel: 'twitter',
        service: 'typefully',
        status: 'success',
        external_id: 'tf_draft_991823',
        external_url: 'https://typefully.com',
        dispatched_at: new Date(Date.now() - 14400000).toISOString(),
      },
      {
        id: 'log-2',
        post_id: 'post-2',
        channel: 'linkedin',
        service: 'buffer',
        status: 'success',
        external_id: 'buf_upd_448291',
        external_url: 'https://buffer.com',
        dispatched_at: new Date(Date.now() - 14400000).toISOString(),
      }
    ]
  },
  {
    id: 'post-3',
    title: 'Weekend Teaser: New Feature Preview',
    content: `Sneak peek at what we are rolling out next week:
Native thread break preview, automated hashtag generation, and Supabase Storage asset piping.

Drop a comment if you want early beta access! 👇`,
    channels: ['twitter', 'threads', 'instagram'],
    status: 'draft',
    media_urls: ['https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&q=80'],
    author_role: 'marketer',
    author_name: 'Marketer Pro',
    notes: 'Draft awaiting final visual graphic from design.',
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    dispatch_logs: [],
  }
];

// Persistent global store across Next.js dev server reloads
declare global {
  // eslint-disable-next-line no-var
  var __memoryStore: {
    posts: Post[];
    ideas: Idea[];
    logs: DispatchLog[];
  } | undefined;
}

if (!global.__memoryStore) {
  global.__memoryStore = {
    posts: initialSeedPosts,
    ideas: initialSeedIdeas,
    logs: initialSeedPosts.flatMap((p) => p.dispatch_logs || []),
  };
}

export const repository = {
  async getPosts(): Promise<Post[]> {
    const supabase = getSupabaseServerClient();
    if (supabase && isSupabaseConfigured()) {
      try {
        const { data: posts, error } = await supabase
          .from('posts')
          .select('*, dispatch_logs(*)')
          .order('created_at', { ascending: false });

        if (!error && posts) {
          return posts as Post[];
        }
        console.warn('Supabase getPosts error, falling back to local store:', error?.message);
      } catch (err) {
        console.warn('Supabase query failed, falling back to local store:', err);
      }
    }
    return global.__memoryStore!.posts;
  },

  async getPostById(id: string): Promise<Post | null> {
    const supabase = getSupabaseServerClient();
    if (supabase && isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('posts')
          .select('*, dispatch_logs(*)')
          .eq('id', id)
          .single();

        if (!error && data) return data as Post;
      } catch (err) {
        console.warn('Supabase getPostById error:', err);
      }
    }
    return global.__memoryStore!.posts.find((p) => p.id === id) || null;
  },

  async createPost(post: Omit<Post, 'id' | 'created_at' | 'updated_at'>): Promise<Post> {
    const newPost: Post = {
      ...post,
      id: `post-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      dispatch_logs: [],
    };

    const supabase = getSupabaseServerClient();
    if (supabase && isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('posts')
          .insert({
            title: newPost.title,
            content: newPost.content,
            channels: newPost.channels,
            status: newPost.status,
            scheduled_at: newPost.scheduled_at,
            published_at: newPost.published_at,
            media_urls: newPost.media_urls,
            author_role: newPost.author_role,
            author_name: newPost.author_name,
            notes: newPost.notes,
          })
          .select()
          .single();

        if (!error && data) {
          newPost.id = data.id;
          return { ...newPost, ...data };
        }
        console.warn('Supabase createPost error, stored in local memory:', error?.message);
      } catch (err) {
        console.warn('Supabase insert failed:', err);
      }
    }

    global.__memoryStore!.posts.unshift(newPost);
    return newPost;
  },

  async updatePost(id: string, updates: Partial<Post>): Promise<Post | null> {
    const supabase = getSupabaseServerClient();
    if (supabase && isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('posts')
          .update({
            ...updates,
            updated_at: new Date().toISOString(),
          })
          .eq('id', id)
          .select('*, dispatch_logs(*)')
          .single();

        if (!error && data) return data as Post;
      } catch (err) {
        console.warn('Supabase updatePost error:', err);
      }
    }

    const postIndex = global.__memoryStore!.posts.findIndex((p) => p.id === id);
    if (postIndex === -1) return null;

    const updated = {
      ...global.__memoryStore!.posts[postIndex],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    global.__memoryStore!.posts[postIndex] = updated;
    return updated;
  },

  async deletePost(id: string): Promise<boolean> {
    const supabase = getSupabaseServerClient();
    if (supabase && isSupabaseConfigured()) {
      try {
        const { error } = await supabase.from('posts').delete().eq('id', id);
        if (!error) return true;
      } catch (err) {
        console.warn('Supabase deletePost error:', err);
      }
    }

    const postIndex = global.__memoryStore!.posts.findIndex((p) => p.id === id);
    if (postIndex !== -1) {
      global.__memoryStore!.posts.splice(postIndex, 1);
      return true;
    }
    return false;
  },

  async addDispatchLog(log: Omit<DispatchLog, 'id' | 'dispatched_at'>): Promise<DispatchLog> {
    const newLog: DispatchLog = {
      ...log,
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      dispatched_at: new Date().toISOString(),
    };

    const supabase = getSupabaseServerClient();
    if (supabase && isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('dispatch_logs')
          .insert({
            post_id: newLog.post_id,
            channel: newLog.channel,
            service: newLog.service,
            status: newLog.status,
            external_id: newLog.external_id,
            external_url: newLog.external_url,
            response_payload: newLog.response_payload,
            error_message: newLog.error_message,
          })
          .select()
          .single();

        if (!error && data) {
          return data as DispatchLog;
        }
      } catch (err) {
        console.warn('Supabase addDispatchLog error:', err);
      }
    }

    global.__memoryStore!.logs.unshift(newLog);
    // Also attach to post in memory if found
    const targetPost = global.__memoryStore!.posts.find((p) => p.id === newLog.post_id);
    if (targetPost) {
      if (!targetPost.dispatch_logs) targetPost.dispatch_logs = [];
      targetPost.dispatch_logs.unshift(newLog);
    }

    return newLog;
  },

  async getIdeas(): Promise<Idea[]> {
    const supabase = getSupabaseServerClient();
    if (supabase && isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('ideas')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && data) return data as Idea[];
      } catch (err) {
        console.warn('Supabase getIdeas error:', err);
      }
    }
    return global.__memoryStore!.ideas;
  },

  async createIdea(idea: Omit<Idea, 'id' | 'created_at' | 'updated_at'>): Promise<Idea> {
    const newIdea: Idea = {
      ...idea,
      id: `idea-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const supabase = getSupabaseServerClient();
    if (supabase && isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('ideas')
          .insert({
            raw_text: newIdea.raw_text,
            author: newIdea.author,
            tags: newIdea.tags,
            status: newIdea.status,
          })
          .select()
          .single();

        if (!error && data) return data as Idea;
      } catch (err) {
        console.warn('Supabase createIdea error:', err);
      }
    }

    global.__memoryStore!.ideas.unshift(newIdea);
    return newIdea;
  },

  async updateIdea(id: string, updates: Partial<Idea>): Promise<Idea | null> {
    const supabase = getSupabaseServerClient();
    if (supabase && isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('ideas')
          .update({
            ...updates,
            updated_at: new Date().toISOString(),
          })
          .eq('id', id)
          .select()
          .single();

        if (!error && data) return data as Idea;
      } catch (err) {
        console.warn('Supabase updateIdea error:', err);
      }
    }

    const index = global.__memoryStore!.ideas.findIndex((i) => i.id === id);
    if (index === -1) return null;
    const updated = {
      ...global.__memoryStore!.ideas[index],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    global.__memoryStore!.ideas[index] = updated;
    return updated;
  },

  async deleteIdea(id: string): Promise<boolean> {
    const supabase = getSupabaseServerClient();
    if (supabase && isSupabaseConfigured()) {
      try {
        const { error } = await supabase.from('ideas').delete().eq('id', id);
        if (!error) return true;
      } catch (err) {
        console.warn('Supabase deleteIdea error:', err);
      }
    }

    const index = global.__memoryStore!.ideas.findIndex((i) => i.id === id);
    if (index !== -1) {
      global.__memoryStore!.ideas.splice(index, 1);
      return true;
    }
    return false;
  }
};
