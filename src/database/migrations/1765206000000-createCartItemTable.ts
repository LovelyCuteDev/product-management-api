import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCartItemTable1765206000000 implements MigrationInterface {
  name = 'CreateCartItemTable1765206000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE \`cart_item\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`userId\` int NOT NULL,
        \`productId\` int NOT NULL,
        \`quantity\` int NOT NULL DEFAULT '1',
        \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        PRIMARY KEY (\`id\`),
        KEY \`IDX_cart_user\` (\`userId\`),
        KEY \`IDX_cart_product\` (\`productId\`)
      ) ENGINE=InnoDB
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE `cart_item`');
  }
}


