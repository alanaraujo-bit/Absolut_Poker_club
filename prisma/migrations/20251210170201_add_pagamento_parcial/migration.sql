-- CreateTable
CREATE TABLE `pagamentos_parciais` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `comanda_id` INTEGER NOT NULL,
    `valor` DECIMAL(10, 2) NOT NULL,
    `forma_pagamento` VARCHAR(191) NOT NULL,
    `data_pagamento` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `estornado` BOOLEAN NOT NULL DEFAULT false,
    `data_estorno` DATETIME(3) NULL,
    `itens_json` TEXT NOT NULL,
    `observacao` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `pagamentos_parciais` ADD CONSTRAINT `pagamentos_parciais_comanda_id_fkey` FOREIGN KEY (`comanda_id`) REFERENCES `comandas`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
