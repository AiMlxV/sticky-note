import { useState, useEffect } from 'react';
import { PlusCircle, Trash2, Edit2, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createClient } from '@supabase/supabase-js';

interface Post {
  id: string;
  content: string;
  created_at: string;
  title: string;
  color: string;
  rotation: number;
  updated_at?: string;  // Optional since it may not exist for new posts
}

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseKey);

const PostItCMS = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [showAddPost, setShowAddPost] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const colors = [
    'bg-yellow-200 shadow-md',
    'bg-pink-200 shadow-md',
    'bg-blue-200 shadow-md',
    'bg-green-200 shadow-md',
    'bg-purple-200 shadow-md',
    'bg-orange-200 shadow-md'
  ];

  const getRandomRotation = () => {
    const rotations = [-2, -1, 0, 1, 2];
    return rotations[Math.floor(Math.random() * rotations.length)];
  };

  const [newPost, setNewPost] = useState({
    title: '',
    content: '',
  });

  // Fetch posts from Supabase
  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setPosts(data || []);
    } catch (error) {
      if (error instanceof Error) {
        setErrorMsg(error.message);
      } else {
        setErrorMsg('An unknown error occurred');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const addPost = async () => {
    if (newPost.title.trim() || newPost.content.trim()) {
      try {
        const post = {
          title: newPost.title,
          content: newPost.content,
          color: colors[Math.floor(Math.random() * colors.length)],
          rotation: getRandomRotation(),
          created_at: new Date().toISOString(),
        };

        const { data, error } = await supabase
          .from('posts')
          .insert([post])
          .select()
          .single();

        if (error) throw error;

        setPosts([data, ...posts]);
        setNewPost({ title: '', content: '' });
        setShowAddPost(false);
      } catch (error) {
        console.error('Error adding post:', error);
        if (error instanceof Error) {
          setErrorMsg(error.message);
        } else {
          setErrorMsg('An unknown error occurred');
        }
      }
    }
  };

  const deletePost = async (id: string) => {
    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setPosts(prevPosts =>
        prevPosts.filter(post => post.id !== id)
      );
    } catch (error: any) {
      console.error('Error deleting post:', error);
      setErrorMsg(error.message);
    }
  };

  const startEditing = (post: Post) => {
    setEditingPost(post);
    setNewPost({
      title: post.title,
      content: post.content,
    });
    setShowAddPost(true);
  };

  const updatePost = async () => {
    try {
      if (!editingPost) return;

      const updatedPost = {
        title: newPost.title,
        content: newPost.content,
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('posts')
        .update(updatedPost)
        .eq('id', editingPost.id)
        .select()
        .single();

      if (error) throw error;

      setPosts(prevPosts =>
        prevPosts.map(post => (post.id === editingPost?.id ? data : post))
      );

      setEditingPost(null);
      setNewPost({ title: '', content: '' });
      setShowAddPost(false);
    } catch (error: any) {
      console.error('Error updating post:', error);
      setErrorMsg(error.message);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-4 md:p-6"
         style={{
           backgroundImage: `
             linear-gradient(#e5e5e5 1px, transparent 1px),
             linear-gradient(90deg, #e5e5e5 1px, transparent 1px)
           `,
           backgroundSize: '20px 20px'
         }}>
      <div className="max-w-7xl mx-auto">
        {errorMsg && (
          <div className="bg-red-100 border border-red-400 text-red-700 p-4 mb-4 rounded">
            Error: {errorMsg}
          </div>
        )}
        {/* Header and Controls */}
        <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4 mb-8 shadow-sm">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <h1 className="text-3xl font-mono text-gray-800">Sticky Notes</h1>
            
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              <div className="relative flex-grow">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search notes..."
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-yellow-400"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <Button
                onClick={() => setShowAddPost(true)}
                className="bg-yellow-400 hover:bg-yellow-500 text-gray-800"
              >
                <PlusCircle className="w-4 h-4 mr-2" />
                Add Note
              </Button>
            </div>
          </div>
        </div>

        {/* Add/Edit Note Modal */}
        {showAddPost && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-yellow-200 rounded-lg shadow-lg w-full max-w-md transform transition-all">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold text-gray-800">
                    {editingPost ? 'Edit Note' : 'New Note'}
                  </h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowAddPost(false);
                      setEditingPost(null);
                      setNewPost({ title: '', content: '' });
                    }}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>

                <div className="space-y-4">
                  <input
                    type="text"
                    placeholder="Title"
                    className="w-full p-2 bg-transparent border-b border-gray-400 focus:outline-none focus:border-gray-600"
                    value={newPost.title}
                    onChange={(e) => setNewPost({...newPost, title: e.target.value})}
                  />
                  <textarea
                    placeholder="Write your note..."
                    rows={4}
                    className="w-full p-2 bg-transparent border-b border-gray-400 focus:outline-none focus:border-gray-600 resize-none"
                    value={newPost.content}
                    onChange={(e) => setNewPost({...newPost, content: e.target.value})}
                  />
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setShowAddPost(false);
                        setEditingPost(null);
                        setNewPost({ title: '', content: '' });
                      }}
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={editingPost ? updatePost : addPost}
                      className="bg-yellow-400 hover:bg-yellow-500 text-gray-800"
                    >
                      {editingPost ? 'Update' : 'Stick it!'}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Posts Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {posts.filter(post => 
            post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            post.content.toLowerCase().includes(searchTerm.toLowerCase())
          ).map(post => (
            <div
              key={post.id}
              className={`${post.color} aspect-square p-4 rounded-sm min-h-[200px]
                flex flex-col relative group hover:z-10 hover:scale-105
                transition-all duration-300`}
              style={{ 
                transform: `rotate(${post.rotation}deg)`,
              }}
            >
              <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 hover:bg-black/10"
                  onClick={() => startEditing(post)}
                >
                  <Edit2 className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 hover:bg-black/10"
                  onClick={() => deletePost(post.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
              <h3 className="font-mono text-lg mb-2 pr-16 text-gray-800 line-clamp-1">
                {post.title}
              </h3>
              <div className="font-mono text-sm text-gray-700 flex-grow overflow-hidden line-clamp-6">
                {post.content}
              </div>
              
              <div className="mt-2 text-xs text-gray-600">
                {new Date(post.created_at).toLocaleDateString()}
                {post.updated_at ? ` (edited: ${new Date(post.updated_at).toLocaleDateString()})` : ''}
              </div>
            </div>
          ))}
        </div>

        {posts.length === 0 && (
          <div className="text-center text-gray-500 mt-8 text-xl">
            {searchTerm ? 'No matching notes found.' : 'Add your first note!'}
          </div>
        )}
      </div>
    </div>
  );
};

export default PostItCMS;