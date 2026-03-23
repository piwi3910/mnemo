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
@Unique(["requesterUserId", "ownerUserId", "notePath"])
export class AccessRequest {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column("text")
  requesterUserId: string;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  requester: User;

  @Column("text")
  ownerUserId: string;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  owner: User;

  @Column("text")
  notePath: string;

  @Column("text", { default: "pending" })
  status: string;

  @CreateDateColumn()
  createdAt: Date;
}
