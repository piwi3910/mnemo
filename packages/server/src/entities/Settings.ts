import { Entity, PrimaryColumn, Column } from "typeorm";

@Entity()
export class Settings {
  @PrimaryColumn("text")
  key: string;

  @Column("text")
  value: string;
}
