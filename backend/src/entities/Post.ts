import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './User';
import { Comment } from './Comment';
import { Like } from './Like';

export type Category = 'news' | 'insight' | 'learning';
export type Sentiment = 'BULLISH' | 'BEARISH' | 'NEUTRAL';

@Entity('posts')
@Index(['category', 'createdAt']) // מאיץ שליפת טאבים ממוינים
@Index(['ticker']) // מאיץ חיפוש לפי מניה
@Index(['authorId', 'createdAt']) // מאיץ את טבלת המובילים
export class Post {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 200 })
  title: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'varchar', length: 20, default: 'insight' })
  category: Category;

  @Column({ type: 'varchar', length: 12, nullable: true })
  ticker: string | null;

  @Column({ type: 'varchar', length: 10, nullable: true })
  sentiment: Sentiment | null;

  @Column({ type: 'uuid' })
  authorId: string;

  @ManyToOne(() => User, (user) => user.posts, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'authorId' })
  author: User;

  @OneToMany(() => Comment, (c) => c.post)
  comments: Comment[];

  @OneToMany(() => Like, (l) => l.post)
  likes: Like[];

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
