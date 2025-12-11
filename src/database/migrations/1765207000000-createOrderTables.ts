import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateOrderTables1765207000000 implements MigrationInterface {
  name = 'CreateOrderTables1765207000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE \`order\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`userId\` int NOT NULL,
        \`status\` enum('PENDING','PAID','CANCELLED') NOT NULL DEFAULT 'PAID',
        \`totalPrice\` decimal(10,2) NOT NULL,
        \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        PRIMARY KEY (\`id\`),
        KEY \`IDX_order_user\` (\`userId\`)
      ) ENGINE=InnoDB
    `);

    await queryRunner.query(`
      CREATE TABLE \`order_item\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`orderId\` int NOT NULL,
        \`productId\` int NOT NULL,
        \`quantity\` int NOT NULL,
        \`unitPrice\` decimal(10,2) NOT NULL,
        PRIMARY KEY (\`id\`),
        KEY \`IDX_order_item_order\` (\`orderId\`),
        KEY \`IDX_order_item_product\` (\`productId\`)
      ) ENGINE=InnoDB
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE `order_item`');
    await queryRunner.query('DROP TABLE `order`');
  }
}


