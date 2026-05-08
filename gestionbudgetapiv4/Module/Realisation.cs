using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace GESTIONBUDGETAPI.Module
{
    [Table("realisation")]
    public class Realisation
    {
        [Key]
        public int real_id { get; set; }
        public int real_plannificationid { get; set; }
        public DateTime real_daterealisation { get; set; }
        public decimal? real_prixunitaire { get; set; }
        public decimal? real_montantreel { get; set; }
        public String? real_description { get; set; }
        public int real_actionid { get; set; }
        public String? real_image { get; set; }
    }
}
