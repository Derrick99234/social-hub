import { getSupabaseServerClient, isSupabaseConfigured } from '@/lib/supabase/server';
import { Post, DispatchLog, Idea } from '@/types';

// In-memory store fallback for offline/transient caching (starts completely empty for production)
const initialSeedIdeas: Idea[] = [];
const initialSeedPosts: Post[] = [];

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
    posts: [],
    ideas: [],
    logs: [],
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
