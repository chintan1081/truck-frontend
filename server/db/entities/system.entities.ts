import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";
import { OwnedEntity } from "./base.entity";

@Entity("app_settings")
export class SettingsEntity extends OwnedEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "boolean", default: true })
  dieselApprovalRequired!: boolean;

  @Column({ type: "boolean", default: true })
  limitStrictEnforcement!: boolean;

  @Column("varchar")
  companyName!: string;

  @Column("varchar")
  companyEmail!: string;

  @Column("varchar")
  companyContact!: string;

  @Column("varchar")
  companyWhatsapp!: string;

  @Column("varchar")
  companyAddress!: string;

  @Column("simple-json", { nullable: true })
  companyServices!: string[];
}

@Entity("custom_alerts")
export class CustomAlertEntity extends OwnedEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column("varchar")
  title!: string;

  @Column("varchar")
  description!: string;

  @Column("varchar")
  category!: string;

  @Column("varchar")
  urgency!: string;

  @Column("varchar")
  date!: string;

  @Column({ type: "varchar", nullable: true })
  truckId?: string;

  @Column({ type: "boolean", default: false })
  isResolved!: boolean;
}
