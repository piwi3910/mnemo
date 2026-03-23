import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity()
export class User {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column("text", { unique: true })
  email: string;

  @Column("text")
  name: string;

  @Column("text", { nullable: true })
  passwordHash: string | null;

  @Column("text", { default: "user" })
  role: string;

  @Column("text", { nullable: true })
  avatarUrl: string | null;

  @Column("boolean", { default: false })
  disabled: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
