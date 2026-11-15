import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from './User';
import { Post } from './Post';

@Entity('comments')
@Index(['postId', 'createdAt'])
export class Comment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'uuid' })
  postId: string;

  @ManyToOne(() => Post, (p) => p.comments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'postId' })
  post: Post;

  @Column({ type: 'uuid' })
  authorId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'authorId' })
  author: User;

  /** תגובה לתגובה: מצביע לתגובת האב (null = תגובה ראשית) */
  @Column({ type: 'uuid', nullable: true })
  parentId: string | null;

  @ManyToOne(() => Comment, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'parentId' })
  parent: Comment | null;

  /** המשתמש שתויג בתגובה (בעל התגובה שעליה מגיבים) */
  @Column({ type: 'uuid', nullable: true })
  replyToUserId: string | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'replyToUserId' })
  replyToUser: User | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
