import { Player } from '@app/models';
import sharp from 'sharp';

export class PlayerImageGenerator {
  private readonly backgroundColor = '#ffffff';
  private readonly textColor = '#24292e';

  private readonly width = 1200;
  private readonly height = 630;

  private readonly amountGames = 25;

  async generateImage(id: string) {
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    const playerQry = Player.createQueryBuilder('player')
      .select(['player.id', 'player.slug', 'player.memberId', 'player.firstName', 'player.lastName'])
      .where('player.slug = :id and "game"."id" is not null', { id })
      .setParameter('oneYearAgo', oneYearAgo)
      .orderBy('game.playedAt', 'DESC');

    const player = await playerQry.getOne();

    if (!player) {
      return {
        status: 404,
        message: 'Player not found',
      };
    }

    const svgImage = `
      <svg width="${this.width}" height="${this.height}" xmlns="http://www.w3.org/2000/svg">
        <rect width="${this.width}" height="${this.height}" fill="${this.backgroundColor}" />
      
        ${this.getGeneralInfo(player)}

      </svg>
    `;

    const imageBuffer = await sharp(Buffer.from(svgImage)).png().toBuffer();

    return imageBuffer;
  }

  getGeneralInfo(player: Player) {
    return `
        <text x="75" y="150" font-family="Arial" font-size="100" fill="${this.textColor}">
            <tspan font-weight="bold">${player.fullName}</tspan>
        </text>
      `;
  }
}
