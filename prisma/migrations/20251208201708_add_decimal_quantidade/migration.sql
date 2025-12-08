/*
  Warnings:

  - You are about to alter the column `quantidade` on the `itens_comanda` table. The data in that column could be lost. The data in that column will be cast from `Int` to `Decimal(10,3)`.
  - You are about to alter the column `quantidade` on the `itens_pedido` table. The data in that column could be lost. The data in that column will be cast from `Int` to `Decimal(10,3)`.

*/
-- AlterTable
ALTER TABLE `itens_comanda` MODIFY `quantidade` DECIMAL(10, 3) NOT NULL;

-- AlterTable
ALTER TABLE `itens_pedido` MODIFY `quantidade` DECIMAL(10, 3) NOT NULL;
