using GESTIONBUDGETAPI.Data;
using GESTIONBUDGETAPI.Module;
using Microsoft.AspNetCore.Mvc;

namespace GESTIONBUDGETAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class TypeController : ControllerBase
    {
        private readonly BudgetContext _budgetContext;
        public TypeController(BudgetContext BudgetContext)
        {
            _budgetContext = BudgetContext;
        }
        [HttpPost]
        public ActionResult<Types> Create([FromBody] Types type)
        {
            _budgetContext.Types.Add(type);
            _budgetContext.SaveChanges();
            return Ok(type);
        }
        [HttpGet]
        public ActionResult<IEnumerable<Types>> GetAll()
        {
            return _budgetContext.Types.ToList();
        }
        [HttpGet("{id:int}")]
        public ActionResult<Types> GetById(int id)
        {
            var type = _budgetContext.Types.Find(id);
            return Ok(type);
        }
        [HttpPut("{id:int}")]
         public ActionResult<Types> Update(int id, [FromBody] Types type)
        
        {
            var existingType = _budgetContext.Types.Find(id);
            if (existingType == null)
            {
                return NotFound($"Type avec ID {id} introuvable.");
            }

            existingType.type_name = type.type_name;
            _budgetContext.SaveChanges();

            return Ok(existingType);
        }
        [HttpDelete("{id:int}")]
        public ActionResult DeleteById(int id)
        {
            var type = _budgetContext.Types.Find(id);
            if (type == null)
            {
                return NotFound(new { Message = $"Type with id{id}not found." });
            }
            _budgetContext.Types.Remove(type);
            _budgetContext.SaveChanges();
            return Ok(new { Message = $"Type with ID {id} was successfully deleted." });
        }
    }
}