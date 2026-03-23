import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  Unique,
} from "typeorm";
import { User } from "./User";

@Entity()
@Unique(["ownerUserId", "path", "sharedWithUserId"])
export class NoteShare {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column("text")
  ownerUserId: string;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  owner: User;

  @Column("text")
  path: string;

  @Column("boolean")
  isFolder: boolean;

  @Column("text")
  sharedWithUserId: string;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  sharedWith: User;

  @Column("text")
  permission: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
