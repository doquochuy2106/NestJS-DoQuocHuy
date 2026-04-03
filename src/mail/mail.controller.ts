import { Controller, Get } from '@nestjs/common';
import { MailService } from './mail.service';
import { Public, ResponseMessage } from 'src/decorator/customize';
import { MailerService } from '@nestjs-modules/mailer';
import { InjectModel } from '@nestjs/mongoose';
import {
  Subscriber,
  SubscriberDocument,
} from 'src/subscribers/schemas/subscriber.schema';
import { SoftDeleteModel } from 'soft-delete-plugin-mongoose';
import { Job, JobDocument } from 'src/jobs/schemas/job.schema';
import { Cron, CronExpression } from '@nestjs/schedule';

@Controller('mail')
export class MailController {
  constructor(
    private readonly mailService: MailService,
    private mailerService: MailerService,

    @InjectModel(Subscriber.name)
    private subscriberModel: SoftDeleteModel<SubscriberDocument>,

    @InjectModel(Job.name) private jobModel: SoftDeleteModel<JobDocument>,
  ) {}

  @Cron(CronExpression.EVERY_10_SECONDS)
  testCront() {
    console.log('test cront');
  }

  @Get()
  @Public()
  @ResponseMessage('Test email')
  async handleTestEmail() {
    const jobs = [
      {
        name: 'doquochuy1',
        companyName: 'job1',
        salary: '2000 USD',
        skills: ['nodejs', 'reactjs', 'typeScript'],
      },
      {
        name: 'doquochuy2',
        companyName: 'job2',
        salary: '2002 USD',
        skills: ['nodejs2', 'reactjs2', 'typeScript2'],
      },
      {
        name: 'doquochuy3',
        companyName: 'job3',
        salary: '2003 USD',
        skills: ['nodejs3', 'reactjs3', 'typeScript3'],
      },
    ];

    const subscribers = await this.subscriberModel.find({});
    for (const subs of subscribers) {
      const subsSkills = subs.skills;
      const jobWithMatchingSkills = await this.jobModel.find({
        skills: { $in: subsSkills },
      });
      console.log('check');
      if (jobWithMatchingSkills?.length > 0) {
        const jobs = jobWithMatchingSkills.map((item) => {
          return {
            name: item.name,
            companyName: item.company.name,
            salary:
              `${item.salary}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',') + ' đ',
            skills: item.skill,
          };
        });

        await this.mailerService.sendMail({
          to: 'huy.do02062004@gmail.com',
          from: '"Support Team" <support@example.com>', // override default from
          subject: 'Welcome to Nice App! Confirm your Email',
          template: 'newjob',
          context: {
            receiver: subs.name,
            jobs: jobs,
          },
        });
      }
    }
  }
}
