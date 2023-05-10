pipeline {
    agent any

    post {
        failure {
            updateGitlabCommitStatus name: 'build', state: 'failed'
            discordSend footer: 'infra.creativecode.dev.br', link: env.BUILD_URL, result: currentBuild.currentResult, title: "🔴 $JOB_NAME - Falha", webhookURL: "${DISCORD_URL}"
            discordSend footer: 'infra.creativecode.dev.br', link: env.BUILD_URL, result: currentBuild.currentResult, title: "🔴 $JOB_NAME - Falha", webhookURL: "https://discord.com/api/webhooks/1093508379164553398/HCZ6NcU5T1dw9mgXw_YruUnNZl0g0Lqd-iB5k3GTcuaGBm8SacmU5hUBYsbySAm5QP00"
        }
        success {
            updateGitlabCommitStatus name: 'build', state: 'success'
            discordSend footer: 'infra.creativecode.dev.br', link: env.BUILD_URL, result: currentBuild.currentResult, title: "✅ $JOB_NAME - Sucesso", webhookURL: "${DISCORD_URL}"
            discordSend footer: 'infra.creativecode.dev.br', link: env.BUILD_URL, result: currentBuild.currentResult, title: "✅ $JOB_NAME - Sucesso", webhookURL: "https://discord.com/api/webhooks/1093508379164553398/HCZ6NcU5T1dw9mgXw_YruUnNZl0g0Lqd-iB5k3GTcuaGBm8SacmU5hUBYsbySAm5QP00"
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
                sshagent(['PCORDISTA-SSH']) {
                    sh """#!/bin/bash
                        ssh -o StrictHostKeyChecking=no -tt $USER@$HOST -p $PORT '
                         cd '$FOLDER'
                            git pull origin $BRANCH
                        '
                    """
                }
            }
        }
        stage('Install Modules') {
            steps {
                sshagent(['PCORDISTA-SSH']) {
                    sh """#!/bin/bash
                        ssh -tt $USER@$HOST -p $PORT '
                            cd '$FOLDER'
                            yarn
                        '
                    """
                }
            }
        }
        stage('Build') {
            steps {
                sshagent(['PCORDISTA-SSH']) {
                    sh """#!/bin/bash
                        ssh -tt $USER@$HOST -p $PORT '
                            cd '$FOLDER'
                            rm -rf dist
                            yarn build
                            cp .env build/.env
                        '
                    """
                }
            }
        }
        stage('Run Migrations') {
            steps {
                sshagent(['PCORDISTA-SSH']) {
                    sh """#!/bin/bash
                        ssh -tt $USER@$HOST -p $PORT '
                            cd '$FOLDER'
                            set NODE_ENV=production
                            node ace migration:run
                        '
                    """
                }
            }
        }
        stage('Restart') {
            steps {
                sshagent(['PCORDISTA-SSH']) {
                    sh """#!/bin/bash
                        ssh -tt $USER@$HOST -p $PORT '
                            pm2 restart '$APP'
                        '
                    """
                }
            }
        }
    }
}
