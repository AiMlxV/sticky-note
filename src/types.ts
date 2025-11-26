export interface Post {
  id: number;
  title: string;
  content: string;
  color: string;
  rotation: number;
  position: {
    x: number;
    y: number;
  };
  zIndex: number;
  tags: string[];
  created_at: string;
  updated_at?: string;
  pinned: boolean;
}
