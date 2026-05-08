using GESTIONBUDGETAPI.Data;
using GESTIONBUDGETAPI.Module;
using Microsoft.AspNetCore.Mvc;

namespace GESTIONBUDGETAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class NumerocompteController : ControllerBase
    {
        private readonly BudgetContext _budgetContext;

        public NumerocompteController(BudgetContext BudgetContext)
        {
            _budgetContext = BudgetContext;
        }

        [HttpPost]
        public ActionResult<Numero_compte> Create([FromBody] Numero_compte numero_compte)
        {
            numero_compte.numcompt_code = numero_compte.numcompt_code;
            numero_compte.numcompt_classe = numero_compte.numcompt_classe;
            numero_compte.numcompt_intitule = numero_compte.numcompt_intitule;
            _budgetContext.Numero_comptes.Add(numero_compte);
            _budgetContext.SaveChanges();
            return Ok(numero_compte);
        }

        [HttpGet]
        public ActionResult<IEnumerable<Numero_compte>> GetAll()
        {
            return _budgetContext.Numero_comptes.ToList();
        }

        [HttpGet("{id:int}")]
        public ActionResult<Numero_compte> GetById(int id)
        {
            var numero_compte = _budgetContext.Numero_comptes.Find(id);
            return Ok(numero_compte);
        }

        [HttpPut("{id:int}")]
        public ActionResult<Numero_compte> Update(int id, [FromBody] Numero_compte numero_compte)
        {
            var existingNumerocompte = _budgetContext.Numero_comptes.Find(id);
            if (existingNumerocompte == null)
            {
                return NotFound($"numerocompte avec ID {id} introuvable.");
            }

            existingNumerocompte.numcompt_code = numero_compte.numcompt_code;
            existingNumerocompte.numcompt_classe = numero_compte.numcompt_classe;
            existingNumerocompte.numcompt_intitule = numero_compte.numcompt_intitule;

            _budgetContext.SaveChanges();

            return Ok(existingNumerocompte);
        }

        [HttpDelete("{id:int}")]
        public ActionResult DeleteById(int id)
        {
            var numerocompte = _budgetContext.Numero_comptes.Find(id);
            if (numerocompte == null)
            {
                return NotFound(new { Message = $"numerocompte with id{id}not found." });
            }
            _budgetContext.Numero_comptes.Remove(numerocompte);
            _budgetContext.SaveChanges();
            return Ok(new { Message = $"numerocompte with ID {id} was successfully deleted." });
        }

        [HttpPost("bulk")]
        public IActionResult PostBulk([FromBody] List<Numero_compte> comptes)
        {
            _budgetContext.Numero_comptes.AddRange(comptes);
            _budgetContext.SaveChanges();
            return Ok(comptes);
        }
    }
}
