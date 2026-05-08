using GESTIONBUDGETAPI.Data;
using GESTIONBUDGETAPI.Module;
using Microsoft.AspNetCore.Mvc;

namespace GESTIONBUDGETAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class EtatController : ControllerBase
    {
        private readonly BudgetContext _budgetContext;

        public EtatController(BudgetContext BudgetContext)
        {
            _budgetContext = BudgetContext;
        }

        [HttpPost]
        public ActionResult<Etat> Create([FromBody] Etat etat)
        {
            _budgetContext.Etats.Add(etat);
            _budgetContext.SaveChanges();
            return Ok(etat);
        }

        [HttpGet]
        public ActionResult<IEnumerable<Etat>> GetAll()
        {
            return _budgetContext.Etats.ToList();
        }

        [HttpGet("{id:int}")]
        public ActionResult<Etat> GetById(int id)
        {
            var etat = _budgetContext.Etats.Find(id);
            return Ok(etat);
        }

        [HttpPut("{id:int}")]
        public ActionResult<Etat> Update([FromBody] Etat etat)
        {
            _budgetContext.Etats.Update(etat);
            _budgetContext.SaveChanges();
            return Ok();
        }

        [HttpDelete("{id:int}")]
        public ActionResult DeleteById(int id)
        {
            var etat = _budgetContext.Etats.Find(id);
            if (etat == null)
            {
                return NotFound(new { Message = $"etat with id{id}not found." });
            }
            _budgetContext.Etats.Remove(etat);
            _budgetContext.SaveChanges();
            return Ok(new { Message = $"etat with ID {id} was successfully deleted." });
        }
    }
}
