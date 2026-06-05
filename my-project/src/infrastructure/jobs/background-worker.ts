import eventBus from './event-bus';
import ProcessOrdersUseCase from '../../application/use-cases/ProcessOrdersUseCase';

const processOrdersUseCase = new ProcessOrdersUseCase();

eventBus.on('processOrders', async (payload: { batchCount: number }) => {
  try {
    console.log('Background worker starting order processing');
    await processOrdersUseCase.execute();
    console.log('Background worker completed order processing');
  } catch (error) {
    console.error('Background worker error', error);
  }
});

export default eventBus;
