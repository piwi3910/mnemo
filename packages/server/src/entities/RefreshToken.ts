import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
} from "typeorm";
import { User } from "./User";

@Entity()
export class RefreshToken {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column("text")
  userId: string;

  @Column("text")
  tokenHash: string;

  @Column("timestamp")
  expiresAt: Date;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  user: User;

  @CreateDateColumn()
  createdAt: Date;
}
