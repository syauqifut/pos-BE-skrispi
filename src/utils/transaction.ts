import { HttpException } from '../exceptions/HttpException';
import pool from '../db';

/**
 * Generate transaction number with format: PREFIX-YYYYMMDD-XXXX
 * @param type - Transaction type (sale, purchase, adjustment)
 * @param number - Optional custom number, if not provided will count from database
 * @returns Promise<string> - Generated transaction number
 */
export async function generateTransactionNumber(type: string, number?: number): Promise<string> {
  try {
    // 1. Determine prefix based on transaction type
    const prefixMap: Record<string, string> = {
      sale: 'SAL',
      purchase: 'PUR',
      adjustment: 'ADJ'
    };
    const prefix = prefixMap[type];
    if (!prefix) throw new Error(`Unknown transaction type: ${type}`);

    // 2. Get count - use provided number or count from database
    let count: number;
    if (number !== undefined && number !== null) {
      count = number;
    } else {
        const client = await pool.connect();
        const result = await pool.query(
        `SELECT COUNT(*) AS count FROM transactions WHERE type = $1 AND date = CURRENT_DATE`,
        [type]
      );
      count = parseInt(result.rows[0]?.count || '0', 10) + 1;
    }

    // 3. Format date and counter
    const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, ''); // YYYYMMDD
    const counterPart = count.toString().padStart(4, '0'); // 0001

    // 4. Combine into transaction number
    const transactionNo = `${prefix}-${datePart}-${counterPart}`;
    return transactionNo;
  } catch (error) {
    console.error('Error generating transaction number:', error);
    throw new HttpException(500, 'Failed to generate transaction number');
  }
}
