import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateProductImageTable1765208000000
  implements MigrationInterface
{
  name = 'CreateProductImageTable1765208000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE \`product_image\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`productId\` int NOT NULL,
        \`url\` varchar(255) NOT NULL,
        \`sortOrder\` int NOT NULL DEFAULT '0',
        PRIMARY KEY (\`id\`),
        KEY \`IDX_product_image_product\` (\`productId\`)
      ) ENGINE=InnoDB
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE `product_image`');
  }
}


