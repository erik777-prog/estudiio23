// CORREÇÕES PARA OS HORÁRIOS DO MODAL

// 1. SUBSTITUIR a geração de horários (linha ~1151):
// ANTES:
// Horários de funcionamento: 7:30 às 18:00
// const horarios = [];
// for (let hora = 7; hora < 18; hora++) {
//   for (let minuto = 0; minuto < 60; minuto += 30) {
//     if (hora === 7 && minuto === 0) continue; // Pular 7:00
//     if (hora === 17 && minuto === 30) continue; // Pular 17:30
//     
//     const horario = `${hora.toString().padStart(2, '0')}:${minuto.toString().padStart(2, '0')}`;
//     horarios.push(horario);
//   }
// }

// DEPOIS:
// Horários de funcionamento: 8:00 às 17:00 (intervalos de 1 hora)
// const horarios = [];
// for (let hora = 8; hora <= 17; hora++) {
//   const horario = `${hora.toString().padStart(2, '0')}:00`;
//   horarios.push(horario);
// }

// 2. SUBSTITUIR a função isHorarioOcupado (linha ~1220):
// ANTES:
// function isHorarioOcupado(horario, horariosOcupados) {
//   // Converter horário para minutos para facilitar comparação
//   const [hora, minuto] = horario.split(':').map(Number);
//   const horarioMinutos = hora * 60 + minuto;
//   
//   // Verificar se este horário ou os próximos 2 horários estão ocupados
//   for (let i = 0; i < 2; i++) {
//     const horarioVerificar = horarioMinutos + (i * 30);
//     const horaVerificar = Math.floor(horarioVerificar / 60);
//     const minutoVerificar = horarioVerificar % 60;
//     const horarioString = `${horaVerificar.toString().padStart(2, '0')}:${minutoVerificar.toString().padStart(2, '0')}`;
//     
//     if (horariosOcupados.includes(horarioString)) {
//       return true;
//     }
//   }
//   
//   return false;
// }

// DEPOIS:
// function isHorarioOcupado(horario, horariosOcupados) {
//   // Para intervalos de 1 hora, apenas verificar se o horário exato está ocupado
//   return horariosOcupados.includes(horario);
// }

// 3. ADICIONAR CSS para scroll nos horários:
// No arquivo css/style.css, na seção .horarios-grid, adicionar:
// overflow-y: auto;
// max-height: 250px; /* ou o valor desejado */

// 4. REMOVER a duplicata da função renderAgendaHorarios (linha ~3170)
// Deletar toda a segunda ocorrência da função que começa na linha 3170
