import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

/**
 * The single account table. Every other entity references a user via its
 * `userId` foreign key (see OwnedEntity). Kept in its own file so the base
 * entity can import it without creating an import cycle.
 */
@Entity("users")
export class UserEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", unique: true })
  email!: string;

  @Column("varchar")
  passwordHash!: string;

  @Column("varchar")
  passwordSalt!: string;

  @Column({ type: "varchar", default: "ADMIN" })
  role!: string;

  @Column({ type: "varchar", nullable: true })
  name?: string;

  @Column({ type: "varchar", nullable: true })
  createdAt?: string;

  @Column({ type: "text", nullable: true })
  profilePhoto?: string;
}
