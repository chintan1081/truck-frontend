import { Column, Index, ManyToOne, JoinColumn } from "typeorm";
import { UserEntity } from "./user.entity";

/**
 * Base class for every user-owned record.
 *
 * Instead of isolating tenants in separate Postgres schemas, all data lives in a
 * single schema and every row carries a `userId` foreign key back to the users
 * table. Repositories must always filter by `userId` so a user only ever sees
 * (and can only mutate) their own rows.
 *
 * `userId` is the source of truth used in queries; the `user` relation exists to
 * enforce the foreign key (with cascade delete) at the database level.
 */
export abstract class OwnedEntity {
  @Index()
  @Column("varchar")
  userId!: string;

  @ManyToOne(() => UserEntity, { onDelete: "CASCADE", nullable: true })
  @JoinColumn({ name: "userId" })
  user?: UserEntity;
}
