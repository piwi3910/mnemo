import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  Unique,
} from "typeorm";
import { User } from "./User";

@Entity()
@Unique(["provider", "providerAccountId"])
export class AuthProvider {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column("text")
  userId: string;

  @Column("text")
  provider: string;

  @Column("text")
  providerAccountId: string;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  user: User;

  @CreateDateColumn()
  createdAt: Date;
}
