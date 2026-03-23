import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
} from "typeorm";
import { User } from "./User";

@Entity()
export class InviteCode {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column("text", { unique: true })
  code: string;

  @Column("text")
  createdBy: string;

  @Column("text", { nullable: true })
  usedBy: string | null;

  @Column("timestamp", { nullable: true })
  expiresAt: Date | null;

  @ManyToOne(() => User)
  createdByUser: User;

  @CreateDateColumn()
  createdAt: Date;
}
