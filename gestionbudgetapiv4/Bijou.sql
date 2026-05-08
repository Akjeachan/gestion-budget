-- ⚠️ ATTENTION: Avant d'exécuter, supprimez l'ancienne vue:
-- DROP VIEW IF EXISTS V_BonPrecommande;

CREATE VIEW V_BonPrecommande
AS
    SELECT
        DL.cbMarq, -- clé primaire ligne
        DL.AR_Ref, -- référence article
        DL.DL_Design, -- désignation
        DL.DL_Qte, -- quantité
        DL.DL_PrixUnitaire, -- prix unitaire
        DL.DL_MontantHT, -- montant HT
        DL.DL_MontantTTC, -- montant TTC
        ISNULL(DE.cbCreation, DL.cbCreation) AS cbCreation, -- date création (entête ou ligne)
        DL.DO_Ref
    -- référence document de la ligne
    FROM F_DocLigne DL
        LEFT JOIN F_DocEntete DE -- ✅ LEFT JOIN pour inclure TOUTES les lignes
        ON DL.DO_Ref = DE.DO_Ref
    -- jointure entre entête et ligne
    WHERE DL.DO_Ref IS NOT NULL;
-- Exclure les lignes sans référence document

-- 📝 Pour appliquer cette modification:
-- 1️⃣ Copiez cette requête dans SQL Server Management Studio
-- 2️⃣ Connectez-vous à la base 'bijou'
-- 3️⃣ Exécutez d'abord: DROP VIEW IF EXISTS V_BonPrecommande;
-- 4️⃣ Puis exécutez le CREATE VIEW ci-dessus
-- 5️⃣ Vérifiez: SELECT COUNT(*) FROM V_BonPrecommande; (devrait afficher 278)
-- 6️⃣ Redémarrez l'application: dotnet run

-- DELETE FROM realisation; -- commented to preserve data

CREATE OR ALTER VIEW v_boncommande_sage
AS
    SELECT
        DL.cbMarq,
        DL.AR_Ref,
        DL.DL_Design,
        DL.DL_Qte,
        DL.DL_PrixUnitaire,
        DL.DL_MontantHT,
        DL.DL_MontantTTC,
        DE.cbCreation AS doc_cbCreation,
        DE.DO_Ref AS doc_DO_Ref,
        DE.DO_Type
    FROM F_DOCLIGNE DL
        INNER JOIN F_DOCENTETE DE ON DL.DO_Piece = DE.DO_Piece
    WHERE DE.DO_Type = 12;

CREATE OR ALTER VIEW v_facture_sage
AS
    SELECT
        DL.cbMarq,
        DL.AR_Ref,
        DL.DL_Design,
        DL.DL_Qte,
        DL.DL_PrixUnitaire,
        DL.DL_MontantHT,
        DL.DL_MontantTTC,
        DE.cbCreation AS doc_cbCreation,
        DE.DO_Ref AS doc_DO_Ref,
        DE.DO_Type
    FROM F_DOCLIGNE DL
        INNER JOIN F_DOCENTETE DE ON DL.DO_Piece = DE.DO_Piece
    WHERE DE.DO_Type = 17;

-- Vue combinée (BonCommande + Facture) basée uniquement sur DL/DE
CREATE OR ALTER VIEW v_bonfacture_sage
AS
            SELECT *
        FROM v_boncommande_sage
    UNION ALL
        SELECT *
        FROM v_facture_sage;

