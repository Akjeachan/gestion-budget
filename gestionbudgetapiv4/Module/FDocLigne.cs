using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace GESTIONBUDGETAPI.Module
{
    public class FDocLigne
    {
        public string? DO_Domaine { get; set; }
        public string? DO_Type { get; set; }
        public string? CT_Num { get; set; }
        public string? cbCT_Num { get; set; }
        public string? DO_Piece { get; set; }
        public string? cbDO_Piece { get; set; }
        public string? DL_PieceBC { get; set; }
        public string? cbDL_PieceBC { get; set; }
        public string? DL_PieceBL { get; set; }
        public string? cbDL_PieceBL { get; set; }
        public DateTime? DO_Date { get; set; }
        public DateTime? DL_DateBC { get; set; }
        public DateTime? DL_DateBL { get; set; }
        public int? DL_Ligne { get; set; }
        public string? DO_Ref { get; set; }
        public string? cbDO_Ref { get; set; }
        public string? DL_TNomencl { get; set; }
        public decimal? DL_TRemPied { get; set; }
        public decimal? DL_TRemExep { get; set; }
        public string? AR_Ref { get; set; }
        public string? cbAR_Ref { get; set; }
        public string? DL_Design { get; set; }
        public decimal? DL_Qte { get; set; }
        public decimal? DL_QteBC { get; set; }
        public decimal? DL_QteBL { get; set; }
        public decimal? DL_PoidsNet { get; set; }
        public decimal? DL_PoidsBrut { get; set; }
        public decimal? DL_Remise01REM_Valeur { get; set; }
        public int? DL_Remise01REM_Type { get; set; }
        public decimal? DL_Remise02REM_Valeur { get; set; }
        public int? DL_Remise02REM_Type { get; set; }
        public decimal? DL_Remise03REM_Valeur { get; set; }
        public int? DL_Remise03REM_Type { get; set; }
        public decimal? DL_PrixUnitaire { get; set; }
        public decimal? DL_PUBC { get; set; }
        public decimal? DL_Taxe1 { get; set; }
        public int? DL_TypeTaux1 { get; set; }
        public int? DL_TypeTaxe1 { get; set; }
        public decimal? DL_Taxe2 { get; set; }
        public int? DL_TypeTaux2 { get; set; }
        public int? DL_TypeTaxe2 { get; set; }
        public int? CO_No { get; set; }
        public string? cbCO_No { get; set; }
        public int? AG_No1 { get; set; }
        public int? AG_No2 { get; set; }
        public decimal? DL_PrixRU { get; set; }
        public decimal? DL_CMUP { get; set; }
        public int? DL_MvtStock { get; set; }
        public int? DT_No { get; set; }
        public string? cbDT_No { get; set; }
        public string? AF_RefFourniss { get; set; }
        public string? cbAF_RefFourniss { get; set; }
        public string? EU_Enumere { get; set; }
        public decimal? EU_Qte { get; set; }
        public int? DL_TTC { get; set; }
        public int? DE_No { get; set; }
        public string? cbDE_No { get; set; }
        public string? DL_NoRef { get; set; }
        public int? DL_TypePL { get; set; }
        public decimal? DL_PUDevise { get; set; }
        public decimal? DL_PUTTC { get; set; }
        public int DL_No { get; set; } // clé primaire probable
        public DateTime? DO_DateLivr { get; set; }
        public string? CA_Num { get; set; }
        public string? cbCA_Num { get; set; }
        public decimal? DL_Taxe3 { get; set; }
        public int? DL_TypeTaux3 { get; set; }
        public int? DL_TypeTaxe3 { get; set; }
        public decimal? DL_Frais { get; set; }
        public int? DL_Valorise { get; set; }
        public string? AR_RefCompose { get; set; }
        public string? cbAR_RefCompose { get; set; }
        public int? DL_NonLivre { get; set; }
        public string? AC_RefClient { get; set; }
        public decimal? DL_MontantHT { get; set; }
        public decimal? DL_MontantTTC { get; set; }
        public int? DL_FactPoids { get; set; }
        public decimal? DL_Escompte { get; set; }
        public string? DL_PiecePL { get; set; }
        public string? cbDL_PiecePL { get; set; }
        public DateTime? DL_DatePL { get; set; }
        public decimal? DL_QtePL { get; set; }
        public int? DL_NoColis { get; set; }
        public int? DL_NoLink { get; set; }
        public string? cbDL_NoLink { get; set; }
        public string? RP_Code { get; set; }
        public string? cbRP_Code { get; set; }
        public decimal? DL_QteRessource { get; set; }
        public DateTime? DL_DateAvancement { get; set; }
        public string? PF_Num { get; set; }
        public string? cbPF_Num { get; set; }
        public string? DL_CodeTaxe1 { get; set; }
        public string? DL_CodeTaxe2 { get; set; }
        public string? DL_CodeTaxe3 { get; set; }
        public string? DL_PieceOFProd { get; set; }
        public string? DL_PieceDE { get; set; }
        public string? cbDL_PieceDE { get; set; }
        public DateTime? DL_DateDE { get; set; }
        public decimal? DL_QteDE { get; set; }
        public string? DL_Operation { get; set; }
        public int? DL_NoSousTotal { get; set; }
        public int? CA_No { get; set; }
        public string? cbCA_No { get; set; }
        public int? DO_DocType { get; set; }
        public int? cbProt { get; set; }

        [Key]
        public int? cbMarq { get; set; }
        public string? cbCreateur { get; set; }
        public DateTime? cbModification { get; set; }
        public int? cbReplication { get; set; }
        public int? cbFlag { get; set; }
        public DateTime? cbCreation { get; set; }
        public string? cbCreationUser { get; set; }
        public string? cbHash { get; set; }
        public int? cbHashVersion { get; set; }
        public DateTime? cbHashDate { get; set; }
        public int? cbHashOrder { get; set; }
        public string? Colisage { get; set; }
        public string? UniteColisage { get; set; } // "Unité de colisage"
        public string? Commentaires { get; set; }
        public string? DL_RefExterne { get; set; }
    }
}
