using GESTIONBUDGETAPI.Data;
using GESTIONBUDGETAPI.Module;
using Microsoft.AspNetCore.Mvc;

namespace GESTIONBUDGETAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class EtatPlannificationController : ControllerBase
    {
        private readonly BudgetContext _budgetContext;

        public EtatPlannificationController(BudgetContext BudgetContext)
        {
            _budgetContext = BudgetContext;
        }

        [HttpPost]
        public ActionResult<Etat_Plannification> Create(
            [FromBody] Etat_Plannification etat_Plannification
        )
        {
            _budgetContext.Etat_Plannifications.Add(etat_Plannification);
            _budgetContext.SaveChanges();
            return Ok(etat_Plannification);
        }

        [HttpGet]
        public ActionResult<IEnumerable<Etat_Plannification>> GetAll()
        {
            return _budgetContext.Etat_Plannifications.ToList();
        }

        [HttpGet("{id:int}")]
        public ActionResult<Etat_Plannification> GetById(int id)
        {
            var etat_plannification = _budgetContext.Etat_Plannifications.Find(id);
            return Ok(etat_plannification);
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
