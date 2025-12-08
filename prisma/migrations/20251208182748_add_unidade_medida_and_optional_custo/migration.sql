-- AlterTable
ALTER TABLE `produtos` ADD COLUMN `unidade_medida` VARCHAR(191) NOT NULL DEFAULT 'unidade',
    MODIFY `preco_custo` DECIMAL(10, 2) NULL;
