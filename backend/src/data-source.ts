import 'reflect-metadata';
import 'dotenv/config';
import { DataSource } from 'typeorm';
import { User } from './entities/User';
import { Post } from './entities/Post';
import { Comment } from './entities/Comment';
import { Like } from './entities/Like';

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  synchronize: true,
  logging: false,
  entities: [User, Post, Comment, Like],
});
