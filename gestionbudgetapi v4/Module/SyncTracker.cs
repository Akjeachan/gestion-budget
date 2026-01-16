using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace GESTIONBUDGETAPI.Module
{
    [Table("synctracker")]
    public class Synctracker
    {
        [Key]
        [Column("id")]
        public int id { get; set; }

        [Column("last_synced_id")]
        public int LastSyncedId { get; set; }

        [Column("last_sync_date")]
        public DateTime LastSyncDate { get; set; }
    }
}
