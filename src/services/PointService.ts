import { PointsModel } from "../interfaces/database/TableInterfaces";
import PointRepository from "../repositories/PointRepository";

class PointService {
    public async addPoints(userId: string, serverId: string, points: number): Promise<PointsModel> {
        const user = await PointRepository.getPointsByUserIdAsync(userId,serverId);

        if (!user) {
            return await PointRepository.save({
                UserId: userId,
                ServerId: serverId,
                Points: points,
            });
        }

        user.Points += points;
        return await PointRepository.save(user);
    }
}

export default new PointService();