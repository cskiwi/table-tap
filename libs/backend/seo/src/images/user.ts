import { User } from '@app/models';
import sharp from 'sharp';

export class UserImageGenerator {
  private readonly backgroundColor = '#ffffff';
  private readonly textColor = '#24292e';

  private readonly width = 1200;
  private readonly height = 630;

  private readonly amountGames = 25;

  async generateImage(id: string) {
    const oneYearAgo = new Date()
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    const userQry = User.createQueryBuilder('user')
      .select(['user.id', 'user.slug', 'user.memberId', 'user.firstName', 'user.lastName'])
      .where('user.slug = :id and "game"."id" is not null', { id })
      .setParameter('oneYearAgo', oneYearAgo)
      .orderBy('game.playedAt', 'DESC');

    const user = await userQry.getOne()

    if (!user) {
      return {
        status: 404,
        message: 'User not found',
      }
    }

    const svgImage = `
      <svg width="${this.width}" height="${this.height}" xmlns="http://www.w3.org/2000/svg">
        <rect width="${this.width}" height="${this.height}" fill="${this.backgroundColor}" />
      
        ${this.getGeneralInfo(user)}

      </svg>
    `;

    const imageBuffer = await sharp(Buffer.from(svgImage)).png().toBuffer()

    return imageBuffer;
  }

  getGeneralInfo(user: User) {
    return `
        <text x="75" y="150" font-family="Arial" font-size="100" fill="${this.textColor}">
            <tspan font-weight="bold">${user.fullName}</tspan>
        </text>
      `;
  }
}
