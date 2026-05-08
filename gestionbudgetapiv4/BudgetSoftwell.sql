create database BUDGETSOFTWELL;
use BUDGETSOFTWELL
GO
create table type
(
    type_id int IDENTITY(1,1) primary key,
    name_type NVARCHAR(50)
);
create table Departement
(
    dept_id int IDENTITY(1,1) primary key,
    dept_name NVARCHAR(50)
);
create table users
(
    user_id int IDENTITY(1,1) PRIMARY KEY,
    user_name NVARCHAR(50),
    user_identifiant NVARCHAR(50),
    user_password NVARCHAR(255),
    user_type int REFERENCES type(type_id),
    user_Departementid int REFERENCES Departement(Dept_id)
);
drop table Numero_compte;
create table Numero_compte
(
    numcompt_id int IDENTITY(1,1) primary key,
    numcompt_code int,
    numcompt_intitule NVARCHAR(100),
    numcompt_classe int
);
create table etat
(
    etat_id int IDENTITY(1,1) primary key,
    etat_name NVARCHAR(50)
);
create table etat_realisation
(
    etatr_id int IDENTITY(1,1) primary key,
    etatr_name NVARCHAR(50)
);
drop table produit
create table produit
(
    prod_id int IDENTITY(1,1) primary key,
    prod_articleref NVARCHAR(50),
    prod_name NVARCHAR(50),
    prod_rubriqueref NVARCHAR(50)
);
alter table produit add prod_name NVARCHAR(50)
select *
from produit
alter table produit add prod_rubriqueref int REFERENCES Rubrique(rub_id)
update table produit
set prod_rubriqueref int
references rubrique
(rub_reference)
alter table produit add prod_numerocompteid int references Numero_compte(numcompt_id)
alter table produit add prod_updateby int references users(user_id)
create table plannification
(
    plan_id int IDENTITY(1,1) primary key,
    plan_dateupdate date,
    plan_datecreation date,
    plan_etatactionid int REFERENCES etat(etat_id),
    plan_produitid int REFERENCES produit(prod_id),
    plan_nombredemande int,
    plan_prixunitaire DECIMAL(32,2),
    plan_montanttotal DECIMAL(32,2),
    plan_description NVARCHAR(255),
    plan_createdby int references users(user_id),
    plan_ref NVARCHAR(255)
);
alter table plannification add plan_createdby int references users(USER_ID)

create table realisation
(
    real_id int IDENTITY(1,1) primary key,
    real_plannificationid int references plannification(plan_id),
    real_daterealisation date,
    real_prixunitaire DECIMAL(32,2),
    real_montantreel DECIMAL(32,2),
    real_actionid int references etat(etat_id),
    real_description NVARCHAR(255),
    real_image NVARCHAR(255),
);
create table reaffectation
(
    reaffect_id int IDENTITY(1,1) primary key,
    reaffect_datereaffectation date,
    reaffect_budget1id int,
    reaffect_budget2id int,
    reaffect_montantreaffectation DECIMAL(32,2),
    reaffect_description NVARCHAR(255),
    reaffect_etat BIT
);
-- Boolean = BIT avec sql server

-- drop table reaffectation -- commented to preserve budget data
create table budget
(
    budget_id int IDENTITY(1,1) primary key,
    budget_code NVARCHAR(50),
    budget_plannificationid int references plannification(plan_id),
    budget_montant DECIMAL(32,2),
    budget_datecreation date
);
-- drop table realisation; -- commented to preserve budget data
-- drop table users -- commented to preserve users
-- drop table plannification -- commented to preserve budget data
-- drop table etat_realisation -- commented to preserve budget data
-- drop table reaffectation -- commented to preserve budget data
-- drop table produit -- commented to avoid accidental removal
select *
from plannification
select *
from type
alter table produit
add prod_updateby int references users(user_id);
alter table realisation
add     real_actionid int references etat_realisation(etatr_id);
alter table plannification
add plan_createdby int references users(user_id);
alter table users
add user_Departementid int references Departement(dept_id);
alter table reaffectation
add reaffect_etat bit;

alter table realisation  add rel_image NVARCHAR(255)
select *
from produit
select *
from produit
select *
from etat_plannification

select *
from v_plannification
select *
from realisation
alter view v_plannification
AS
    select plannification.*, produit.prod_name, Departement.dept_name, users.user_name, realisation.*, budget.*,
        etat_plan.etat_name as etat_nameplannification,
        etat_real.etat_name as etat_namerealisation
    from plannification LEFT JOIN produit on produit.prod_id= plannification.plan_produitid
        LEFT JOIN users on users.user_id= Plannification.plan_createdby
        LEFT JOIN Departement on Departement.dept_id= users.user_Departementid
        Left join realisation on realisation.real_plannificationid=plannification.plan_id
        Left join budget on plannification.plan_id=budget.budget_plannificationid
        LEFT JOIN etat etat_plan on etat_plan.etat_id = plannification.plan_etatactionid
        LEFT JOIN etat etat_real on etat_real.etat_id = realisation.real_actionid
select *
from realisation
select *
from etat_realisation
select *
from budget
-- drop table budget -- commented to preserve budget data

select *
from Departement;

update realisation set re = 1 where plan_id=2
update realisation
drop real_createby
ALTER TABLE realisation
Rename rel_image to real_image;
ALTER TABLE realisation CHANGE rel_image real_image NVARCHAR
(255);
EXEC sp_rename 'realisation.rel_image', 'real_image', 'COLUMN';


-- drop table realisation -- commented to preserve budget data

select *
from Departement
select *
from budget
select *
from users
UPDATE users
SET user_name = 'Jean Jack',
    user_password = 'Jack1234'
WHERE user_id = 6;
UPDATE users
SET user_identifiant ='Rakoto@gmail.com'
WHERE user_id = 4;

select *
from realisation

plannification
realisation budget reaffectation

create view v_realisation
as
    SELECT
        p.*,
        b.budget_code,
        b.budget_montant,
        rf.reaffect_budget1id,
        rf.reaffect_budget2id,
        rf.reaffect_montantreaffectation,
        r.*
    FROM plannification p
        LEFT JOIN realisation r
        ON p.plan_id = r.real_plannificationid
        LEFT JOIN budget b
        ON p.plan_id = b.budget_plannificationid
        LEFT JOIN reaffectation rf
        ON b.budget_id = rf.reaffect_budget1id
            OR b.budget_id = rf.reaffect_budget2id;

SELECT
    p.*,
    r.real_montantreel,
    r.real_prixunitaire,
    b.budget_code,
    b.budget_montant,
    rf.reaffect_budget1id,
    rf.reaffect_budget2id,
    rf.reaffect_montantreaffectation
FROM plannification p
    LEFT JOIN realisation r
    ON p.plan_id = r.real_plannificationid
    LEFT JOIN budget b
    ON p.plan_id = b.budget_plannificationid
    LEFT JOIN reaffectation rf
    ON b.budget_id = rf.reaffect_budget1id
        OR b.budget_id = rf.reaffect_budget2id;

create or REPLACE FUNCTION insert_into_other_table
()
return trigger as $$
BEGIN
    insert into test.plannification
        (nomproduit,montant,dateplannnification)
    values(tablesouce.nomproduit, tablesource.montant, tablesource.dateplannification)
    return tablesource
;
end;
create trigger trg_insert_to_other
    after
insert on public.
tablecource
for
each
ROW
execute function insert_into_other_table
();
create table Donnee_sage
(
    donsag_id int primary key,
    donsag_arref NVARCHAR(50),
    donsag_design NVARCHAR(50),
    donsag_qte int,
    donsag_prixunitaire decimal(32,2),
    donsag_montantht decimal(32,2),
    donsag_montantttc decimal(32,2),
    donsag_cbcreation date,
    donsag_etatid int references etat(etat_id),
    donsag_doref NVARCHAR(50),
    donsag_type int references donnee_type(donsag_typeid    
);

primary key de docentete cbMarq
primary key de docligne cbMarq
reference pour liaison avec plannification DO_Ref
montant hors taxe DO_TotalHT
date de creation cbCreation 
quantite DL_Qte
prix unitaire DL_PrixUnitaire
montant ht DL_MontantHT
montant TTC DL_MontantTTC

CREATE TABLE SyncTracker
(
    id INT PRIMARY KEY IDENTITY(1,1),
    last_synced_id INT NOT NULL DEFAULT 0,
    last_sync_date DATETIME NOT NULL DEFAULT GETDATE()
)
-- drop table BonPreCommande; -- commented to avoid data loss
CREATE TRIGGER trg_inserttocrmtest
ON [dbo].[F_DOCLIGNE]
AFTER INSERT
AS
BEGIN
    SET NOCOUNT ON;

    INSERT INTO [BUDGETSOFTWELL].[dbo].[BonCommande]
        (bon_arref, bon_dldesign, bon_dlqte, bon_dlprixunitaire, bon_dlmontantht, bon_dlmontantttc, bon_cbcreation)
    SELECT
        i.AR_Ref,
        i.DL_Design,
        i.DL_Qte,
        i.DL_PrixUnitaire,
        i.DL_MontantHT,
        i.DL_MontantTTC,
        i.cbCreation
    FROM inserted i;
END;

grant insert on dbo.BonCommande to akjea;

SELECT name
FROM sys.server_principals
WHERE name = 'akjea';

CREATE LOGIN [akjea] WITH PASSWORD = 'Softwell1234';
GRANT INSERT ON dbo.BonCommande TO [akjea];

SELECT name, type_desc
FROM sys.server_principals
WHERE name = 'akjea';


ALTER ROLE db_datareader ADD MEMBER [akjea];
ALTER ROLE db_datawriter ADD MEMBER [akjea];


select *
from BonCommande

select*
from produit;

select*
from v_plannification

select *
from v_realisation
drop view v_realisation

ALTER VIEW v_realisation
AS
    SELECT DISTINCT
        p.*,
        b.budget_code,
        b.budget_montant,
        pr.*,
        u.*,
        r.*,
        ep.*,
        er.*,
        d.*
    FROM plannification p
        LEFT JOIN realisation r
        ON p.plan_id = r.real_plannificationid
        LEFT JOIN budget b
        ON p.plan_id = b.budget_plannificationid
        LEFT JOIN produit pr
        ON p.plan_produitid = pr.prod_id
        LEFT JOIN etat_plannification ep
        ON p.plan_etatactionid = ep.etat_id
        LEFT JOIN etat_realisation er
        ON r.real_actionid = er.etat_id
        LEFT JOIN users u
        ON p.plan_createdby = u.user_id
        LEFT JOIN Departement d
        ON u.user_Departementid = d.dept_id;

SELECT TABLE_SCHEMA, TABLE_NAME
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_TYPE = 'BASE TABLE';


select *
from produit
DROP TABLE IF EXISTS produit
GO

CREATE TABLE produit
(
    prod_id INT PRIMARY KEY NOT NULL,
    -- ⬅️ SANS IDENTITY
    prod_name NVARCHAR(255)
)
select *
from v_realisation

select *
from BonPreCommande

ALTER TABLE plannification
ADD plan_ref NVARCHAR(50);

select *
from plannification

CREATE VIEW v_bonprecommande
AS
    SELECT
        plannification.*,
        realisation.*,
        budget.*,
        bonprecommande.*,
        users.*,
        produit.*,
        Departement.*
    FROM bonprecommande
        INNER JOIN plannification
        ON plannification.plan_ref = bonprecommande.bon_doref
        LEFT JOIN realisation
        ON realisation.real_plannificationid = plannification.plan_id
        LEFT JOIN budget
        ON budget.budget_plannificationid = plannification.plan_id
        LEFT JOIN users
        ON users.USER_ID = plannification.plan_createdby
        LEFT JOIN produit
        ON produit.prod_id = plannification.plan_produitid
        LEFT JOIN Departement
        ON Departement.dept_id = users.user_Departementid;

ALTER VIEW v_bonprecommande
AS
    SELECT
        plannification.*,
        ISNULL(realisation.real_id, 0) AS real_id,
        budget.*,
        bonprecommande.*,
        users.*,
        produit.*,
        Departement.*
    FROM bonprecommande
        INNER JOIN plannification
        ON plannification.plan_ref = bonprecommande.bon_doref
        LEFT JOIN realisation
        ON realisation.real_plannificationid = plannification.plan_id
        LEFT JOIN budget
        ON budget.budget_plannificationid = plannification.plan_id
        LEFT JOIN users
        ON users.USER_ID = plannification.plan_createdby
        LEFT JOIN produit
        ON produit.prod_id = plannification.plan_produitid
        LEFT JOIN Departement
        ON Departement.dept_id = users.user_Departementid;
select *
from etat_plannification
select *
from bonprecommande

select *
from plannification
select*
from v_bonprecommande
UPDATE plannification
SET plan_ref = 'plan01-2026'
WHERE plan_id = 2;
select *
from v_plannification

SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'v_bonprecommande'
;

-- delete from plannification -- commented to avoid removing data
-- sele -- truncated line

select *
from bonprecommande

insert into etat
    (etat_name)
values
    ('non validé');
insert into etat
    (etat_name)
values
    ('validé');
insert into etat
    (etat_name)
values
    ('refusé');
insert into etat
    (etat_name)
values
    ('cloturé');


insert into type
    (name_type)
values
    ('Admin');
insert into type
    (name_type)
values
    ('Utilisateur');

insert into departement
    (dept_name)
values
    ('Direction');
insert into departement
    (dept_name)
values
    ('Sage');
insert into departement
    (dept_name)
values
    ('Tomate');
insert into departement
    (dept_name)
values
    ('IT');
insert into departement
    (dept_name)
values
    ('RH');
insert into departement
    (dept_name)
values
    ('Marketing');
insert into departement
    (dept_name)
values
    ('Qualiter');
insert into departement
    (dept_name)
values
    ('Logistique');
select *
from Departement
select *
from type

insert into users
    (user_name,user_identifiant,user_password,user_type,user_Departementid)
values
    ('Akjea', 'akjea@gmail.com', 'akjea1234', 2, 4);

insert into users
    (user_name,user_identifiant,user_password,user_type,user_Departementid)
values
    ('Admin', 'admin@gmail.com', 'admin1234', 1, 1);

INSERT INTO numero_compte
    (numcompt_code, numcompt_intitule, numcompt_classe)
VALUES
    (101, 'Caisse principale', 1),
    (102, 'Banque Société Générale', 1),
    (201, 'Clients divers', 2),
    (202, 'Clients étrangers', 2),
    (301, 'Fournisseurs locaux', 3),
    (302, 'Fournisseurs internationaux', 3),
    (401, 'Capital social', 4),
    (402, 'Réserves légales', 4),
    (501, 'Produits des ventes', 5),
    (502, 'Produits financiers', 5),
    (601, 'Charges de personnel', 6),
    (602, 'Charges de loyer', 6);
select *
from type

create table Rubrique
(
    rub_id Int IDENTITY(1,1) primary key,
    rub_reference NVARCHAR(50),
    rub_nom NVARCHAR(50)
);
CREATE VIEW V_BonPrecommande
AS
    SELECT
        -- Clé primaire (utilise cbMarq de F_DOCLIGNE)
        DL.cbMarq,

        -- Informations de la ligne de document (F_DOCLIGNE)
        DL.AR_Ref,
        DL.DL_Design,
        DL.DL_Qte,
        DL.DL_PrixUnitaire,
        DL.DL_MontantHT,
        DL.DL_MontantTTC,

        -- Informations de l'en-tête du document (F_DOCENTETE)
        DE.cbCreation,
        DE.DO_Ref

    FROM F_DOCLIGNE DL
        INNER JOIN F_DOCENTETE DE ON DL.DO_Piece = DE.DO_Piece
    WHERE DE.DO_Type = 0 -- Type 0 = Bon de précommande (à vérifier selon votre configuration Sage)
        AND DE.DO_Domaine = 0;
-- Domaine 0 = Vente (à adapter si nécessaire)

ALTER TABLE produit
ADD prod_rubriqueref INT;

ALTER TABLE produit
ADD prod_rubriqueref NVARCHAR;

select *
from produit
ALTER TABLE produit
ADD CONSTRAINT FK_Produit_Rubrique
    FOREIGN KEY (prod_rubriqueref) REFERENCES Rubrique(rub_id);

alter table produit alter column prod_rubriqueref NVARCHAR(50)
REFERENCES Rubrique
(rub_reference)

SELECT name
FROM sys.foreign_keys
WHERE parent_object_id = OBJECT_ID('produit');

ALTER TABLE produit
DROP CONSTRAINT FK__produit__prod_nu__14270015;
ALTER TABLE produit
DROP CONSTRAINT FK__produit__prod_up__151B244E;
ALTER TABLE produit
DROP CONSTRAINT FK__produit__prod_ru__29221CFB;
ALTER TABLE produit
DROP CONSTRAINT FK_Produit_Rubrique;
ALTER TABLE produit
DROP CONSTRAINT FK__produit__prod_cr__5535A963;

alter table produit drop COLUMN prod_rubriqueref

select *
from produit

alter table produit add prod_rubriqueref NVARCHAR(50)

-- drop table realisation -- commented to preserve budget data
-- drop table budget -- commented to preserve budget data
-- drop table plannification -- commented to preserve budget data
-- drop table produit -- commented to avoid accidental removal

ALTER VIEW v_bonprecommande
AS
    SELECT
        pl.plan_id,
        pl.plan_dateupdate,
        pl.plan_datecreation,
        pl.plan_etatactionid,
        pl.plan_produitid,
        pl.plan_nombredemande,
        pl.plan_prixunitaire,
        pl.plan_montanttotal,
        pl.plan_description,
        pl.plan_createdby,
        ISNULL(r.real_id, 0) AS real_id,
        r.real_prixunitaire,
        r.real_montantreel,
        r.real_image,
        r.real_actionid,
        b.budget_id,
        b.budget_code,
        b.budget_plannificationid,
        b.budget_montant,
        b.budget_datecreation,
        bp.bon_id,
        bp.bon_arref,
        bp.bon_dldesign,
        bp.bon_dlqte,
        bp.bon_dlprixunitaire,
        bp.bon_dlmontantht,
        bp.bon_dlmontantttc,
        bp.bon_cbcreation,
        bp.bon_etatid,
        bp.bon_doref,
        u.USER_ID as user_id,
        u.user_name,
        u.user_identifiant,
        u.user_password,
        u.user_type,
        u.user_Departementid,
        p.prod_name,
        d.dept_name
    FROM bonprecommande bp
        LEFT JOIN produit p -- ⭐ Changé de INNER JOIN à LEFT JOIN
        ON p.prod_articleref = bp.bon_arref
        LEFT JOIN plannification pl
        ON pl.plan_produitid = p.prod_id
        LEFT JOIN (
    SELECT *,
            ROW_NUMBER() OVER (PARTITION BY real_plannificationid ORDER BY real_id DESC) as rn
        FROM realisation
) r ON r.real_plannificationid = pl.plan_id AND r.rn = 1
        LEFT JOIN budget b
        ON b.budget_plannificationid = pl.plan_id
        LEFT JOIN users u
        ON u.USER_ID = pl.plan_createdby
        LEFT JOIN Departement d
        ON d.dept_id = u.user_Departementid;

select *
from produit

select *
from departement

-- Vues pour BonCommande (DO_Type = 12) et Facture (DO_Type = 17)
-- Ces vues extraient les lignes (F_DOCLIGNE) et l'en-tête (F_DOCENTETE)
-- puis relient au produit/plannification/budget/users/departement comme dans v_bonprecommande.

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
        ISNULL(r.real_id, 0) AS real_id,
        r.real_prixunitaire,
        r.real_montantreel,
        b.budget_id,
        b.budget_code,
        u.user_id,
        u.user_name,
        d.dept_name
    FROM F_DOCLIGNE DL
        INNER JOIN F_DOCENTETE DE ON DL.DO_Piece = DE.DO_Piece
        LEFT JOIN produit p ON p.prod_articleref = DL.AR_Ref
        LEFT JOIN plannification pl ON pl.plan_produitid = p.prod_id
        LEFT JOIN (
    SELECT *, ROW_NUMBER() OVER (PARTITION BY real_plannificationid ORDER BY real_id DESC) AS rn
        FROM realisation
) r ON r.real_plannificationid = pl.plan_id AND r.rn = 1
        LEFT JOIN budget b ON b.budget_plannificationid = pl.plan_id
        LEFT JOIN users u ON u.USER_ID = pl.plan_createdby
        LEFT JOIN Departement d ON d.dept_id = u.user_Departementid
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
        DE.DO_Type,
        p.prod_id,
        p.prod_name,
        pl.plan_id,
        pl.plan_ref,
        ISNULL(r.real_id, 0) AS real_id,
        r.real_prixunitaire,
        r.real_montantreel,
        b.budget_id,
        b.budget_code,
        u.user_id,
        u.user_name,
        d.dept_name
    FROM F_DOCLIGNE DL
        INNER JOIN F_DOCENTETE DE ON DL.DO_Piece = DE.DO_Piece
        LEFT JOIN produit p ON p.prod_articleref = DL.AR_Ref
        LEFT JOIN plannification pl ON pl.plan_produitid = p.prod_id
        LEFT JOIN (
    SELECT *, ROW_NUMBER() OVER (PARTITION BY real_plannificationid ORDER BY real_id DESC) AS rn
        FROM realisation
) r ON r.real_plannificationid = pl.plan_id AND r.rn = 1
        LEFT JOIN budget b ON b.budget_plannificationid = pl.plan_id
        LEFT JOIN users u ON u.USER_ID = pl.plan_createdby
        LEFT JOIN Departement d ON d.dept_id = u.user_Departementid
    WHERE DE.DO_Type = 17;

-- Vue combinée (BonCommande + Facture)
CREATE OR ALTER VIEW v_bonfacture_sage
AS
            SELECT *
        FROM v_boncommande_sage
    UNION ALL
        SELECT *
        FROM v_facture_sage;
create table TypeDonnee_sage
(
    typedonsag_id int primary key,
    typedonsag_donneesaage NVARCHAR(50),
    typedonsag_numero int
);
drop table Donnee_sage