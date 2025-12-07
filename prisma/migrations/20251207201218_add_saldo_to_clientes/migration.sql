/*
  Warnings:

  - You are about to drop the `movimentacoes_clientes` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[cpf]` on the table `clientes` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE `movimentacoes_clientes` DROP FOREIGN KEY `movimentacoes_clientes_cliente_id_fkey`;

-- DropForeignKey
ALTER TABLE `pedidos` DROP FOREIGN KEY `pedidos_cliente_id_fkey`;

-- AlterTable
ALTER TABLE `clientes` ADD COLUMN `cpf` VARCHAR(191) NULL;

-- DropTable
DROP TABLE `movimentacoes_clientes`;

-- CreateTable
CREATE TABLE `usuarios` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nome` VARCHAR(191) NOT NULL,
    `username` VARCHAR(191) NOT NULL,
    `senha` VARCHAR(191) NOT NULL,
    `tipo` VARCHAR(191) NOT NULL,
    `ativo` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `usuarios_username_key`(`username`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `comandas` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `cliente_id` INTEGER NOT NULL,
    `garcom_id` INTEGER NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'aberta',
    `data_abertura` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `data_fechamento` DATETIME(3) NULL,
    `valor_total` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `forma_pagamento` VARCHAR(191) NULL,
    `observacao` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `itens_comanda` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `comanda_id` INTEGER NOT NULL,
    `produto_id` INTEGER NOT NULL,
    `quantidade` INTEGER NOT NULL,
    `preco_unitario` DECIMAL(10, 2) NOT NULL,
    `subtotal` DECIMAL(10, 2) NOT NULL,
    `data_hora` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `clientes_cpf_key` ON `clientes`(`cpf`);

-- AddForeignKey
ALTER TABLE `comandas` ADD CONSTRAINT `comandas_cliente_id_fkey` FOREIGN KEY (`cliente_id`) REFERENCES `clientes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `itens_comanda` ADD CONSTRAINT `itens_comanda_comanda_id_fkey` FOREIGN KEY (`comanda_id`) REFERENCES `comandas`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `itens_comanda` ADD CONSTRAINT `itens_comanda_produto_id_fkey` FOREIGN KEY (`produto_id`) REFERENCES `produtos`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
