using GESTIONBUDGETAPI.Data;
using GESTIONBUDGETAPI.Module;
using Microsoft.AspNetCore.Mvc;

namespace GESTIONBUDGETAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class EtatRealisationController : ControllerBase
    {
        private readonly BudgetContext _budgetContext;

        public EtatRealisationController(BudgetContext BudgetContext)
        {
            _budgetContext = BudgetContext;
        }

        [HttpPost]
        public ActionResult<Etat_Realisation> Create([FromBody] Etat_Realisation etat_realisation)
        {
            _budgetContext.Etat_Realisations.Add(etat_realisation);
            _budgetContext.SaveChanges();
            return Ok(etat_realisation);
        }

        [HttpGet]
        public ActionResult<IEnumerable<Etat_Realisation>> GetAll()
        {
            return _budgetContext.Etat_Realisations.ToList();
        }

        [HttpGet("{id:int}")]
        public ActionResult<Etat_Realisation> GetById(int id)
        {
            var etat_realisation = _budgetContext.Etat_Realisations.Find(id);
            return Ok(etat_realisation);
        }

        [HttpPut("{id:int}")]
        public ActionResult<Etat_Plannification> Update(
            [FromBody] Etat_Plannification etat_plannification
        )
        {
            _budgetContext.Etat_Plannifications.Update(etat_plannification);
            _budgetContext.SaveChanges();
            return Ok();
        }

        [HttpDelete("{id:int}")]
        public ActionResult DeleteById(int id)
        {
            var etatplannification = _budgetContext.Etat_Plannifications.Find(id);
            if (etatplannification == null)
            {
                return NotFound(new { Message = $"Etat_plannification with id{id}not found." });
            }
            _budgetContext.Etat_Plannifications.Remove(etatplannification);
            _budgetContext.SaveChanges();
            return Ok(
                new { Message = $"Etat_Plannification with ID {id} was successfully deleted." }
            );
        }
    }
}
