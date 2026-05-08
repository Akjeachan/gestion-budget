using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace GESTIONBUDGETAPI.Module
{
    [Table("rubrique")]
    public class Rubrique
    {
        [Key]
        public int rub_id { get; set; }
        public string? rub_reference { get; set; }
        public String? rub_nom { get; set; }
    }
}
