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
create table etat_plannification
(
    etatp_id int IDENTITY(1,1) primary key,
    etatp_name NVARCHAR(50)
);
create table etat_realisation
(
    etatr_id int IDENTITY(1,1) primary key,
    etatr_name NVARCHAR(50)
);
create table produit
(
    prod_id int IDENTITY(1,1) primary key,
    prod_name NVARCHAR(50),
    prod_dateajout date,
    prod_createdby int references users(user_id)
);
create table plannification
(
    plan_id int IDENTITY(1,1) primary key,
    plan_dateecheance date,
    plan_dateupdate date,
    plan_datecreation date,
    plan_etatactionid int REFERENCES etat_plannification(etatp_id),
    plan_produitid int REFERENCES produit(prod_id),
    plan_nombredemande int,
    plan_prixunitaire DECIMAL(32,2),
    plan_montanttotal DECIMAL(32,2),
    plan_description NVARCHAR(255)
);
create table realisation
(
    real_id int IDENTITY(1,1) primary key,
    real_plannificationid int references plannification(plan_id),
    real_daterealisation date,
    real_prixunitaire DECIMAL(32,2),
    real_montantreel DECIMAL(32,2),
    real_actionid int references etat_realisation(etatr_id),
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
    reaffect_etat Boolean
);
drop table reaffectation
create table budget
(
    budget_id int IDENTITY(1,1) primary key,
    budget_code NVARCHAR(50),
    budget_plannificationid int references plannification(plan_id),
    budget_montant DECIMAL(32,2),
    budget_datecreation date
);
drop table realisation;
drop table users
drop table plannification
drop table etat_realisation
drop table reaffectation
drop table produit
select * from plannification
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
    select plannification.*, produit.prod_name, Departement.dept_name, users.user_name, realisation.*,budget.*
    from plannification LEFT JOIN produit on produit.prod_id= plannification.plan_produitid
        LEFT JOIN users on users.user_id= Plannification.plan_createdby
        LEFT JOIN Departement on Departement.dept_id= users.user_Departementid
        Left join realisation on realisation.real_plannificationid=plannification.plan_id
        Left join budget on plannification.plan_id=budget.budget_plannificationid
select *
from realisation
select *
from etat_realisation
select *
from budget
drop table budget

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


drop table realisation

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

create view v_realisation as
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
create table BonPreCommande
(
    bon_id int primary key,
    bon_arref NVARCHAR(50),
    bon_dldesign NVARCHAR(50),
    bon_dlqte int,
    bon_dlprixunitaire decimal(32,2),
    bon_dlmontantht decimal(32,2),
    bon_dlmontantttc decimal(32,2),
    bon_cbcreation date,
    bon_etatid int references etat_plannification(etatp_id),
    bon_doref NVARCHAR(50)
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

CREATE TABLE SyncTracker (
    id INT PRIMARY KEY IDENTITY(1,1),
    last_synced_id INT NOT NULL DEFAULT 0,
    last_sync_date DATETIME NOT NULL DEFAULT GETDATE()
)
drop table BonPreCommande;
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

select * from v_realisation
drop view v_realisation

ALTER VIEW v_realisation AS
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
        ON p.plan_etatactionid = ep.etatp_id
    LEFT JOIN etat_realisation er
        ON r.real_actionid = er.etatr_id
    LEFT JOIN users u
        ON p.plan_createdby = u.user_id
    LEFT JOIN Departement d
        ON u.user_Departementid = d.dept_id;


SELECT TABLE_SCHEMA, TABLE_NAME
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_TYPE = 'BASE TABLE';


select * from produit
DROP TABLE IF EXISTS produit
GO

CREATE TABLE produit (
    prod_id INT PRIMARY KEY NOT NULL,  -- ⬅️ SANS IDENTITY
    prod_name NVARCHAR(255)
)
select * from v_realisation

select * from BonPreCommande

ALTER TABLE plannification
ADD plan_ref NVARCHAR(50);

select * from plannification

ALTER VIEW v_bonprecommande AS
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

ALTER VIEW v_bonprecommande AS
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
select * from etat_plannification
select * from bonprecommande

select * from plannification
select*from v_bonprecommande
UPDATE plannification
SET plan_ref = 'plan01-2026'
WHERE plan_id = 2;
select * from v_plannification

SELECT COLUMN_NAME, DATA_TYPE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'v_plannification';

-- Vérifier la structure de la vue
SELECT TOP 1 * FROM v_plannification;

-- Ou cette requête pour voir les types de colonnes
SELECT 
    COLUMN_NAME,
    DATA_TYPE,
    CHARACTER_MAXIMUM_LENGTH,
    IS_NULLABLE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'v_plannification'
ORDER BY ORDINAL_POSITION;

SELECT 
    COLUMN_NAME,
    DATA_TYPE,
    ORDINAL_POSITION
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'v_plannification'
ORDER BY ORDINAL_POSITION;

DROP VIEW IF EXISTS v_plannification;
GO

ALTER VIEW v_plannification AS
SELECT 
    p.plan_id,
    p.plan_dateecheance,
    p.plan_dateupdate,
    p.plan_datecreation,
    p.plan_etatactionid,
    p.plan_produitid,
    p.plan_nombredemande,
    p.plan_prixunitaire,
    p.plan_montanttotal,
    p.plan_description,
    p.plan_createdby,
    p.plan_ref,
    
    prod.prod_name,
    dept.dept_name,
    u.user_name,
    
    r.real_id,
    r.real_plannificationid,
    r.real_daterealisation,
    r.real_prixunitaire,
    r.real_montantreel,
    r.real_actionid,
    r.real_description,
    r.real_image,
    
    b.budget_id,
    b.budget_code,
    b.budget_plannificationid,
    b.budget_montant,
    b.budget_datecreation,
    
    ep.etatp_id,
    ep.etatp_name,
    er.etatr_id,
    er.etatr_name

FROM plannification p
    LEFT JOIN produit prod ON p.plan_produitid = prod.prod_id
    LEFT JOIN users u ON p.plan_createdby = u.user_id
    LEFT JOIN departement dept ON u.user_Departementid= dept.dept_id
    LEFT JOIN realisation r ON p.plan_id = r.real_plannificationid
    LEFT JOIN budget b ON p.plan_id = b.budget_plannificationid
    LEFT JOIN etat_plannification ep ON p.plan_etatactionid = ep.etatp_id
    LEFT JOIN etat_realisation er ON r.real_actionid = er.etatr_id;
GO


select * from etat_realisation

DELETE FROM realisation;

ALTER VIEW v_bonprecommande AS
SELECT 
    plannification.plan_id,
    plannification.plan_dateecheance,
    plannification.plan_dateupdate,
    plannification.plan_datecreation,
    plannification.plan_etatactionid,
    plannification.plan_produitid,
    plannification.plan_nombredemande,
    plannification.plan_prixunitaire,
    plannification.plan_montanttotal,
    plannification.plan_description,
    plannification.plan_createdby,
    ISNULL(real_latest.real_id, 0) AS real_id,
    real_latest.real_prixunitaire,
    real_latest.real_montantreel,
    real_latest.real_image,
    real_latest.real_actionid,
    budget.budget_id,
    budget.budget_code,
    budget.budget_plannificationid,
    budget.budget_montant,
    budget.budget_datecreation,
    bonprecommande.bon_id,
    bonprecommande.bon_arref,
    bonprecommande.bon_dldesign,
    bonprecommande.bon_dlqte,
    bonprecommande.bon_dlprixunitaire,
    bonprecommande.bon_dlmontantht,
    bonprecommande.bon_dlmontantttc,
    bonprecommande.bon_cbcreation,
    bonprecommande.bon_etatid,
    bonprecommande.bon_doref,
    users.USER_ID as user_id,
    users.user_name,
    users.user_identifiant,
    users.user_password,
    users.user_type,
    users.user_Departementid,
    produit.prod_name,
    Departement.dept_name
FROM bonprecommande
INNER JOIN plannification  
    ON plannification.plan_ref = bonprecommande.bon_doref
LEFT JOIN (
    SELECT *,
           ROW_NUMBER() OVER (PARTITION BY real_plannificationid ORDER BY real_id DESC) as rn
    FROM realisation
) real_latest ON real_latest.real_plannificationid = plannification.plan_id AND real_latest.rn = 1
LEFT JOIN budget  
    ON budget.budget_plannificationid = plannification.plan_id
LEFT JOIN users  
    ON users.USER_ID = plannification.plan_createdby
LEFT JOIN produit  
    ON produit.prod_id = plannification.plan_produitid
LEFT JOIN Departement  
    ON Departement.dept_id = users.user_Departementid;

    select * from users

    update users set user_name='Admin',user_identifiant='Admin@gmail.com',user_password='admin1234' where user_id=7

    select * from plannification 
    update plannification set plan_ref='plan22026' where plan_id=5

    SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'v_bonprecommande'
';

delete from plannification
sele

select * from bonprecommande