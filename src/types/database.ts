export type Score = 0.5 | 1.0 | 1.5 | 2.0 | 2.5 | 3.0 | 3.5 | 4.0 | 4.5 | 5.0

export interface Profile {
  id: string
  username: string
  display_name: string | null
  bio: string | null
  avatar_url: string | null
  created_at: string
}

export interface Album {
  id: string
  musicbrainz_id: string
  title: string
  artist: string
  release_year: number | null
  cover_url: string | null
  genres: string[]
  avg_rating: number | null
  rating_count: number
  cached_at: string
}

export interface Rating {
  id: string
  user_id: string
  album_id: string
  score: Score
  created_at: string
  updated_at: string
}

export interface Review {
  id: string
  rating_id: string
  user_id: string
  album_id: string
  /** Max 2,000 characters — enforced by DB CHECK constraint and must be validated client-side before submit. */
  body: string
  like_count: number
  created_at: string
}

export interface ReviewLike {
  user_id: string
  review_id: string
  created_at: string
}

export interface Follow {
  follower_id: string
  following_id: string
  created_at: string
}

export interface List {
  id: string
  user_id: string
  title: string
  description: string | null
  is_ranked: boolean
  like_count: number
  created_at: string
}

export interface ListAlbum {
  list_id: string
  album_id: string
  position: number | null
  created_at: string
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: Omit<Profile, 'created_at'>
        Update: Partial<Omit<Profile, 'id'>>
      }
      albums: {
        Row: Album
        Insert: Omit<Album, 'id' | 'avg_rating' | 'rating_count' | 'cached_at'> & { id?: string }
        Update: Partial<Omit<Album, 'id'>>
      }
      ratings: {
        Row: Rating
        Insert: Omit<Rating, 'id' | 'created_at' | 'updated_at'>
        Update: Pick<Rating, 'score'>
      }
      reviews: {
        Row: Review
        Insert: Omit<Review, 'id' | 'like_count' | 'created_at'>
        Update: Pick<Review, 'body'>
      }
      review_likes: {
        Row: ReviewLike
        Insert: Omit<ReviewLike, 'created_at'>
        Update: never
      }
      follows: {
        Row: Follow
        Insert: Omit<Follow, 'created_at'>
        Update: never
      }
      lists: {
        Row: List
        Insert: Omit<List, 'id' | 'like_count' | 'created_at'> & { id?: string }
        Update: Partial<Pick<List, 'title' | 'description' | 'is_ranked'>>
      }
      list_albums: {
        Row: ListAlbum
        Insert: Omit<ListAlbum, 'created_at'>
        Update: Pick<ListAlbum, 'position'>
      }
    }
  }
}
