using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace GESTIONBUDGETAPI.Module
{
    [Table("type")]
    public class Types
    {
        [Key]
        public int type_id { get; set; }
        public string? type_name { get; set; }
    }
}
