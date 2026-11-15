import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Post } from './Post';

export type Role = 'USER' | 'ADMIN';

// NOTE: every column declares an explicit SQL type. Relying on
// emitDecoratorMetadata inference breaks under some runners (e.g. tsx/esbuild)
// with ColumnTypeUndefinedError.
@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 30, unique: true })
  username: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 255 })
  password: string;

  @Column({ type: 'varchar', length: 10, default: 'USER' })
  role: Role;

  @Column({ type: 'varchar', length: 500, nullable: true })
  avatarUrl: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @OneToMany(() => Post, (post) => post.author)
  posts: Post[];
}
