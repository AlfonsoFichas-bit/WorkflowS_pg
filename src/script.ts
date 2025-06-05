import {
  deleteDinosaurById,
  deleteTask,
  findDinosaurByName,
  findDinosaurTasksByDinosaurId,
  insertDinosaur,
  insertTask,
  updateDinosaur,
} from "./db/db.ts";

// Función principal para ejecutar el script
async function main() {
  try {
    console.log("Insertando dinosaurio...");
    await insertDinosaur({
      name: "Denosaur",
      description: "Dinosaurs should be simple.",
    });

    console.log("Buscando dinosaurio por nombre...");
    const dinosaurs = await findDinosaurByName("Denosaur");
    
    if (dinosaurs.length === 0) {
      console.log("No se encontró el dinosaurio");
      return;
    }
    
    const dino = dinosaurs[0];
    console.log("Dinosaurio encontrado:", dino);

    console.log("Insertando tarea...");
    await insertTask({
      dinosaurId: dino.id,
      description: "Remove unnecessary config.",
      isComplete: false,
    });

    console.log("Actualizando dinosaurio...");
    const newDeno = {
      id: dino.id,
      name: "Denosaur",
      description: "The simplest dinosaur.",
    };
    await updateDinosaur(newDeno);

    console.log("Buscando tareas del dinosaurio...");
    const tasks = await findDinosaurTasksByDinosaurId(dino.id);
    console.log(`Se encontraron ${tasks.length} tareas asociadas al dinosaurio`);
    
    // Eliminar primero las tareas asociadas
    for (const task of tasks) {
      console.log(`Eliminando tarea ${task.id}...`);
      await deleteTask(task.id);
    }
    
    console.log("Eliminando dinosaurio...");
    await deleteDinosaurById(dino.id);
    
    console.log("Script completado con éxito");
  } catch (error) {
    console.error("Error al ejecutar el script:", error);
  }
}

// Ejecutar la función principal
await main();