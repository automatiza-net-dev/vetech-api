pipeline {
    agent any

    post {
        failure {
            updateGitlabCommitStatus name: 'build', state: 'failed'
            discordSend footer: 'infra.creativecode.dev.br', link: env.BUILD_URL, result: currentBuild.currentResult, title: "🔴 $JOB_NAME - Falha", webhookURL: "${DISCORD_URL}"
        }
        success {
            updateGitlabCommitStatus name: 'build', state: 'success'
            discordSend footer: 'infra.creativecode.dev.br', link: env.BUILD_URL, result: currentBuild.currentResult, title: "✅ $JOB_NAME - Sucesso", webhookURL: "${DISCORD_URL}"
        }
        aborted {
            updateGitlabCommitStatus name: 'build', state: 'canceled'
        }
    }

    options {
        gitLabConnection('DEFAULT')
    }

    triggers {
        gitlab(triggerOnPush: true, triggerOnMergeRequest: true, branchFilterType: 'All')
    }

    stages {
        stage('Gitlab') {
            steps {
                echo 'Notify GitLab'
                updateGitlabCommitStatus name: 'build', state: 'pending'
            }
        }
        stage('Transfer Files') {
            steps {
                sshagent(['VETECH-PROD']) {
                    sh """
                        ssh -oStrictHostKeyChecking=no $USER@$HOST -p $PORT '
                            cd '$FOLDER'
                            git pull origin master
                        '
                    """
                }
            }
        }
        stage('Install Modules') {
            steps {
                sshagent(['VETECH-PROD']) {
                    sh """#!/bin/bash
                        ssh -tt $USER@$HOST -p $PORT'
                            cd '$FOLDER'
                            yarn
                        '
                    """
                }
            }
        }
        stage('Build') {
            steps {
                sshagent(['VETECH-PROD']) {
                    sh """#!/bin/bash
                        ssh -tt $USER@$HOST -p $PORT'
                            cd '$FOLDER'
                            rm -rf dist
                            yarn build
                        '
                    """
                }
            }
        }
        stage('Run Migrations') {
            steps {
                sshagent(['VETECH-PROD']) {
                    sh """#!/bin/bash
                        ssh -tt $USER@$HOST -p $PORT'
                            cd '$FOLDER'
                            set NODE_ENV=production
                            npm run typeorm migration:run
                        '
                    """
                }
            }
        }
        stage('Restart') {
            steps {
                sshagent(['VETECH-PROD']) {
                    sh """#!/bin/bash
                        ssh -tt $USER@$HOST -p $PORT'
                            pm2 restart '$APP'
                        '
                    """
                }
            }
        }
    }
}
