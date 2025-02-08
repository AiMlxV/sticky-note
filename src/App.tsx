import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Search, X, Pin } from 'lucide-react';
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
  pinned: boolean;
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
  const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; postId: string | null }>({
    show: false,
    postId: null
  });

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
          pinned: false,
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

  const togglePin = async (post: Post) => {
    try {
      const updatedPost = {
        pinned: !post.pinned,
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('posts')
        .update(updatedPost)
        .eq('id', post.id)
        .select()
        .single();

      if (error) throw error;

      setPosts(prevPosts =>
        prevPosts.map(p => (p.id === post.id ? data : p))
      );
    } catch (error: any) {
      console.error('Error toggling pin:', error);
      setErrorMsg(error.message);
    }
  };

  const handleDeleteClick = (postId: string) => {
    setDeleteConfirm({ show: true, postId });
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirm.postId) return;
    
    await deletePost(deleteConfirm.postId);
    setDeleteConfirm({ show: false, postId: null });
  };

  const sortedPosts = [...posts].sort((a, b) => {
    if (a.pinned === b.pinned) {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
    return a.pinned ? -1 : 1;
  });

  // Updated post size calculation with better spacing
  const getPostSize = (title: string, content: string) => {
    const contentLength = content.length;
    const titleLength = title.length;
    const totalLength = contentLength + titleLength;
    
    // Extra large post: Very long content or very long title + content
    if (totalLength > 400 || contentLength > 300) {
      return 'col-span-2 row-span-2 min-h-[300px]';
    }
    
    // Wide post: Long title but moderate content
    if (titleLength > 40 || (titleLength > 25 && contentLength > 50)) {
      return 'col-span-2 row-span-1 min-h-[200px]';
    }
    
    // Tall post: Short title but long content
    if (contentLength > 200) {
      return 'col-span-1 row-span-2 min-h-[300px]';
    }
    
    // Regular post: Short content and title
    return 'col-span-1 row-span-1 min-h-[200px]';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-2 md:p-6 pb-20" // Added pb-20 for FAB space
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
        <div className="bg-white/80 backdrop-blur-sm rounded-lg p-3 md:p-4 mb-4 md:mb-8 shadow-sm">
          <div className="flex flex-col gap-3">
            <h1 className="text-2xl md:text-3xl font-mono text-gray-800">WhiteBoards</h1>
            
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="ค้นหา..."
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-yellow-400 text-sm md:text-base"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
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
                    placeholder="ชื่อเรื่อง"
                    className="w-full p-2 bg-transparent border-b border-gray-400 focus:outline-none focus:border-gray-600"
                    value={newPost.title}
                    onChange={(e) => setNewPost({...newPost, title: e.target.value})}
                  />
                  <textarea
                    placeholder="เขียนลงตรงนี้เลย👀..."
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
                      ยกเลิก
                    </Button>
                    <Button 
                      onClick={editingPost ? updatePost : addPost}
                      className="bg-yellow-400 hover:bg-yellow-500 text-gray-800"
                    >
                      {editingPost ? 'อัปเดตเลย' : 'อัปโหลด!'}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteConfirm.show && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-lg w-full max-w-sm transform transition-all">
              <div className="p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4">
                  แน่ใจใช่มั้ย / Are U Sure? 🤔 
                </h2>
                <p className="text-gray-600 mb-6">
                  แน่ใจหรือไม่ว่าต้องการลบโน้ตนี้? <br></br>ย้อนกลับไม่ได้นะ 🤯
                </p>
                <p className="text-gray-600 mb-6">
                  Are u sure to delete this note? <br></br>It can't be undone. 🤯
                </p>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    onClick={() => setDeleteConfirm({ show: false, postId: null })}
                  >
                    ยกเลิก ❌
                  </Button>
                  <Button 
                    className="bg-red-500 hover:bg-red-600 text-white"
                    onClick={handleConfirmDelete}
                  >
                    ลบ 🗑️
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modified Posts Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 
                    auto-rows-[minmax(200px,auto)] gap-6">
          {sortedPosts.filter(post => 
            post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            post.content.toLowerCase().includes(searchTerm.toLowerCase())
          ).map(post => (
            <div
              key={post.id}
              className={`${post.color} p-4 md:p-5 rounded-lg
                flex flex-col relative group hover:z-10 hover:scale-105
                transition-all duration-300 ${post.pinned ? 'ring-2 ring-yellow-500' : ''}
                ${getPostSize(post.title, post.content)}`}
              style={{ 
                transform: `rotate(${post.rotation}deg)`,
              }}
            >
              {/* Pin indicator if pinned */}
              {post.pinned && (
                <div className="absolute top-3 right-3">
                  <Pin className="w-4 h-4 text-yellow-600 fill-current" />
                </div>
              )}

              {/* Title */}
              <h3 className="font-mono text-base md:text-lg mb-3 text-gray-800 line-clamp-2">
                {post.title}
              </h3>

              {/* Content */}
              <div className={`font-mono text-sm text-gray-700 flex-grow overflow-hidden
                ${getPostSize(post.title, post.content).includes('row-span-2') ? 'line-clamp-12' : 'line-clamp-8'}`}>
                {post.content}
              </div>
              
              {/* Footer with date and controls */}
              <div className="mt-4 pt-2 border-t border-gray-200/50 flex flex-col gap-2">
                {/* Date info */}
                <div className="text-xs text-gray-600">
                  {new Date(post.created_at).toLocaleDateString()}
                  {post.updated_at ? ` (edited: ${new Date(post.updated_at).toLocaleDateString()})` : ''}
                </div>

                {/* Icon-only Controls */}
                <div className="flex justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`h-8 w-8 p-0 hover:bg-black/5 
                      ${post.pinned ? 'text-yellow-600' : 'text-gray-600'}`}
                    onClick={() => togglePin(post)}
                    title={post.pinned ? 'Unpin' : 'Pin'}
                  >
                    <Pin className={`w-4 h-4 ${post.pinned ? 'fill-current' : ''}`} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 hover:bg-black/5 text-gray-600"
                    onClick={() => startEditing(post)}
                    title="Edit"
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 hover:bg-black/5 
                      text-red-600/70 hover:text-red-600
                      md:opacity-0 md:group-hover:opacity-100 transition-opacity"
                    onClick={() => handleDeleteClick(post.id)}
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Modified Floating Action Button */}
        <button
          onClick={() => setShowAddPost(true)}
          className="fixed bottom-6 right-6 
                     bg-white/80 backdrop-blur-sm hover:bg-yellow-50
                     text-gray-800 border-2 border-yellow-400
                     w-12 h-12 rounded-xl shadow-lg 
                     flex items-center justify-center
                     transition-all duration-300 hover:scale-105 
                     hover:rotate-90 z-50"
        >
          <Plus className="w-6 h-6 text-yellow-600" />
        </button>

        {posts.length === 0 && (
          <div className="text-center text-gray-500 mt-8 text-xl">
            {searchTerm ? 'No matching notes found.' : 'เพิ่มโน้ตเลย😆'}
          </div>
        )}
      </div>
    </div>
  );
};

export default PostItCMS;